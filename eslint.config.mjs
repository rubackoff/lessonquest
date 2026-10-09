import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [{ ignores: ["tmp/**", "output/**", "third-party/**", "deploy/**", "hosting/**"] }, ...nextVitals];

export default eslintConfig;
