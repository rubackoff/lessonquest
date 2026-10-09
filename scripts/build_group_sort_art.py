from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "tmp" / "imagegen" / "group-sort"
PACK_DIR = ROOT / "tmp" / "group-sort-atlas-input"
GAME_DIR = ROOT / "public" / "game-assets" / "games" / "group-sort"
MASCOT_DIR = ROOT / "public" / "game-assets" / "common" / "mascot"


SPRITES = {
    "station-green.png": ("station-a-cutout.png", (352, 440), 10, True),
    "station-blue.png": ("station-blue-cutout.png", (352, 440), 10, True),
    "station-gold.png": ("station-gold-cutout.png", (352, 440), 10, True),
    "tray.png": ("tray-cutout.png", (1120, 210), 12, True),
    "card.png": ("card-cutout.png", (288, 172), 10, True),
    "motif-graph.png": ("motif-graph-cutout.png", (176, 176), 8, False),
    "motif-atom.png": ("motif-atom-cutout.png", (176, 176), 8, False),
    "motif-feather.png": ("motif-feather-cutout.png", (176, 176), 8, False),
    "mascot-pedestal.png": ("mascot-pedestal-cutout.png", (320, 108), 8, True),
    "particle-spark.png": ("particle-spark-source.png", (64, 64), 2, False),
}


def alpha_bbox(image: Image.Image) -> tuple[int, int, int, int]:
    alpha = image.getchannel("A")
    bbox = alpha.point(lambda value: 255 if value > 4 else 0).getbbox()
    if bbox is None:
        raise ValueError("asset has no visible pixels")
    return bbox


def scaled_alpha(alpha: Image.Image, opacity: float) -> Image.Image:
    return alpha.point(lambda value: round(value * opacity))


def prepare_sprite(
    source: Path,
    target: Path,
    size: tuple[int, int],
    padding: int,
    shadow: bool,
) -> None:
    image = Image.open(source).convert("RGBA")
    alpha = image.getchannel("A").point(
        lambda value: 0 if value <= 16 else round((value - 16) * 255 / 239)
    )
    image.putalpha(alpha)
    image = image.crop(alpha_bbox(image))
    max_size = (size[0] - padding * 2, size[1] - padding * 2)
    image.thumbnail(max_size, Image.Resampling.LANCZOS)

    x = (size[0] - image.width) // 2
    y = size[1] - padding - image.height
    canvas = Image.new("RGBA", size, (0, 0, 0, 0))

    if shadow:
        mask_canvas = Image.new("L", size, 0)
        mask_canvas.paste(image.getchannel("A"), (x, y))
        blurred = mask_canvas.filter(ImageFilter.GaussianBlur(max(3, size[1] // 80)))
        offset_mask = Image.new("L", size, 0)
        offset_mask.paste(blurred, (0, max(3, size[1] // 70)))
        shadow_layer = Image.new("RGBA", size, (28, 61, 68, 0))
        shadow_layer.putalpha(scaled_alpha(offset_mask, 0.16))
        canvas.alpha_composite(shadow_layer)

    canvas.alpha_composite(image, (x, y))
    target.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(target, "PNG", optimize=True, compress_level=9)


def prepare_background() -> None:
    source = ROOT / "design-references" / "group-sort" / "classroom-background-plate-v1.png"
    image = Image.open(source).convert("RGB")
    image.thumbnail((1024, 576), Image.Resampling.LANCZOS)
    GAME_DIR.mkdir(parents=True, exist_ok=True)
    image.save(GAME_DIR / "background.png", "PNG", optimize=True, compress_level=9)


def prepare_mascot() -> None:
    source = ROOT / "public" / "corgi-coach-full-v3.png"
    image = Image.open(source).convert("RGBA")
    image = image.crop(alpha_bbox(image))
    image.thumbnail((496, 496), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    canvas.alpha_composite(image, ((512 - image.width) // 2, 512 - image.height - 4))
    MASCOT_DIR.mkdir(parents=True, exist_ok=True)
    canvas = canvas.quantize(
        colors=256,
        method=Image.Quantize.FASTOCTREE,
        dither=Image.Dither.FLOYDSTEINBERG,
    )
    canvas.save(MASCOT_DIR / "corgi-coach.png", "PNG", optimize=True, compress_level=9)


def prepare() -> None:
    PACK_DIR.mkdir(parents=True, exist_ok=True)
    for output_name, (source_name, size, padding, shadow) in SPRITES.items():
        source = SOURCE_DIR / source_name
        if not source.exists():
            raise FileNotFoundError(source)
        prepare_sprite(source, PACK_DIR / output_name, size, padding, shadow)
    prepare_background()
    prepare_mascot()
    report(PACK_DIR)
    report(GAME_DIR)
    report(MASCOT_DIR)


def optimize_atlas() -> None:
    atlas = GAME_DIR / "atlas.png"
    atlas_data = GAME_DIR / "atlas.json"
    if not atlas.exists():
        raise FileNotFoundError(atlas)
    if not atlas_data.exists():
        raise FileNotFoundError(atlas_data)

    data = json.loads(atlas_data.read_text(encoding="utf-8"))
    if "textures" in data:
        texture = data["textures"][0]
        frames = {frame["filename"]: {key: value for key, value in frame.items() if key != "filename"}
                  for frame in texture["frames"]}
        data = {
            "frames": frames,
            "meta": {
                "app": "free-tex-packer-cli (Phaser 3 export normalized for Phaser 4 load.atlas)",
                "version": "1",
                "image": "atlas.png",
                "format": "RGBA8888",
                "size": texture["size"],
                "scale": "1",
            },
        }

    data["frames"]["card"]["scale9Borders"] = {
        "x": 24,
        "y": 24,
        "w": SPRITES["card.png"][1][0] - 48,
        "h": SPRITES["card.png"][1][1] - 48,
    }
    data["frames"]["tray"]["scale9Borders"] = {
        "x": 40,
        "y": 32,
        "w": SPRITES["tray.png"][1][0] - 80,
        "h": SPRITES["tray.png"][1][1] - 80,
    }
    atlas_data.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    image = Image.open(atlas).convert("RGBA")
    image.save(atlas, "PNG", optimize=True, compress_level=9)
    report(GAME_DIR)


def report(directory: Path) -> None:
    for path in sorted(directory.glob("*.png")):
        with Image.open(path) as image:
            alpha = image.convert("RGBA").getchannel("A")
            corners = (
                alpha.getpixel((0, 0)),
                alpha.getpixel((image.width - 1, 0)),
                alpha.getpixel((0, image.height - 1)),
                alpha.getpixel((image.width - 1, image.height - 1)),
            )
            print(f"{path.relative_to(ROOT)} {image.width}x{image.height} {path.stat().st_size}B corners={corners}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=("prepare", "optimize-atlas"))
    args = parser.parse_args()
    if args.mode == "prepare":
        prepare()
    else:
        optimize_atlas()


if __name__ == "__main__":
    main()
