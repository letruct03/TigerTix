module.exports = {
  roots: [
    "<rootDir>/backend",
    "<rootDir>/frontend/src"
  ],
  moduleNameMapper: {
    "^react$": "<rootDir>/node_modules/react",
    "^react-dom$": "<rootDir>/node_modules/react-dom",
    "\\.(css|less|sass|scss)$": "identity-obj-proxy"
  },
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest"
  },
};