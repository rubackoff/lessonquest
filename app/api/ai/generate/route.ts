import { NextResponse } from 'next/server'
import {
  buildGenerationMessages,
  getGeneratedDraftShapeIssues,
  getDraftJsonSchema,
  parseGeneratedDraft,
  parseGenerateDraftInput,
  type GenerateDraftInput,
} from '@/lib/ai-generation'
import { validateEditorDraft, type EditorDraft } from '@/lib/editor-runtime'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string
      refusal?: string
    }
  }>
}

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const input = parseGenerateDraftInput(body)
  if (!input) {
    return NextResponse.json(
      { error: 'Describe the exercise in at least ten characters and choose a game template.' },
      { status: 400 },
    )
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    return NextResponse.json({ error: 'AI provider is not configured on the server.' }, { status: 503 })
  }

  try {
    const result = await generateValidatedDraft(input, apiKey)
    if (!result.draft) {
      return NextResponse.json(
        {
          error: `The AI returned a draft that failed after retrying: ${result.issues[0]}`,
        },
        { status: 422 },
      )
    }

    return NextResponse.json({
      gameId: input.gameId,
      draft: result.draft,
      model: process.env.OPENAI_MODEL?.trim() || 'gpt-5-6-sol',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : ''

    if (message === 'AI_TIMEOUT') {
      return NextResponse.json({ error: 'The AI didn\'t have time to respond. Try again.' }, { status: 504 })
    }

    return NextResponse.json({ error: 'AI provider is temporarily unavailable.' }, { status: 502 })
  }
}

async function generateValidatedDraft(input: GenerateDraftInput, apiKey: string) {
  let repairIssues: string[] = []

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const rawDraft = await requestStructuredDraft(input, apiKey, repairIssues)
    const draft = parseGeneratedDraft(input.gameId, rawDraft)

    if (!draft) {
      repairIssues = getGeneratedDraftShapeIssues(input.gameId, rawDraft)
      continue
    }

    const validationIssues = validateEditorDraft(input.gameId, draft)
    if (validationIssues.length === 0) return { draft, issues: [] }
    repairIssues = validationIssues
  }

  return {
    draft: null,
    issues: repairIssues.length > 0 ? repairIssues : ['incorrect structure of required fields'],
  }
}

async function requestStructuredDraft(
  input: GenerateDraftInput,
  apiKey: string,
  repairIssues: string[],
): Promise<unknown> {
  const baseUrl = (process.env.OPENAI_BASE_URL?.trim() || 'https://api.openai.com/v1').replace(/\/$/, '')
  const model = process.env.OPENAI_MODEL?.trim() || 'gpt-5-6-sol'
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 90_000)

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: buildGenerationMessages(input, repairIssues),
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: `tutor_activity_${input.gameId.replaceAll('-', '_')}`,
            strict: true,
            schema: getDraftJsonSchema(input.gameId),
          },
        },
        max_tokens: 1_800,
      }),
      signal: controller.signal,
    })

    if (!response.ok) throw new Error('AI_PROVIDER_ERROR')

    const payload = (await response.json()) as ChatCompletionResponse
    const message = payload.choices?.[0]?.message
    if (message?.refusal) throw new Error('AI_PROVIDER_ERROR')
    if (typeof message?.content !== 'string') throw new Error('AI_PROVIDER_ERROR')

    return JSON.parse(message.content)
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw new Error('AI_TIMEOUT')
    throw error
  } finally {
    clearTimeout(timeout)
  }
}
