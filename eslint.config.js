import tseslint from "typescript-eslint"
import prettier from "eslint-plugin-prettier"

export default [
  ...tseslint.configs.recommended,
  {
    plugins: {
      prettier
    },
    rules: {
      "prettier/prettier": "error"
    }
  }
]