# Changelog

## [0.2.1](https://github.com/Arno2T/LDJS-Projet7/compare/v0.2.0...v0.2.1) (2026-11-23)


### Bug Fixes

* **client:** exclude docker healthcheck from nginx access logs and patch libxml2 CVE ([#34](https://github.com/Arno2T/LDJS-Projet7/issues/34)) ([1f03e94](https://github.com/Arno2T/LDJS-Projet7/commit/1f03e9438c7b6a90da3a84567bd024ca0a22df7d))

## [0.2.0](https://github.com/Arno2T/LDJS-Projet7/compare/v0.1.0...v0.2.0) (2026-11-20)


### Features

* **server:** add structured JSON logging with pino and pino-http ([#30](https://github.com/Arno2T/LDJS-Projet7/issues/30)) ([f34c2f9](https://github.com/Arno2T/LDJS-Projet7/commit/f34c2f9e36ebe16c27a18fa3407cdce542ed2556))

## 0.1.0 (2026-11-20)


### Bug Fixes

* initial setup (types, lint, error handler, lockfiles) ([#1](https://github.com/Arno2T/LDJS-Projet7/issues/1)) ([0d04138](https://github.com/Arno2T/LDJS-Projet7/commit/0d041388bfd6d2bb3fdbdf20aaa75a9374430c20))


### Build & containers

* add docker-compose stack and docker dependabot updates ([#27](https://github.com/Arno2T/LDJS-Projet7/issues/27)) ([00a930e](https://github.com/Arno2T/LDJS-Projet7/commit/00a930eb6f81aa18a9486404bac4ae41df4cef60))
* **server:** containerize server with multi-stage Dockerfile ([#24](https://github.com/Arno2T/LDJS-Projet7/issues/24)) ([0cfc5ba](https://github.com/Arno2T/LDJS-Projet7/commit/0cfc5ba6e83fc15f2a5ce3c1666f1356c1008f52))


### CI/CD

* add coverage reports (lcov) as artifacts ([#4](https://github.com/Arno2T/LDJS-Projet7/issues/4)) ([c8513f3](https://github.com/Arno2T/LDJS-Projet7/commit/c8513f397b899ea2479aff5bf43430f4f3e53340))
* add npm audit, Gitleak and Dependabot ([#6](https://github.com/Arno2T/LDJS-Projet7/issues/6)) ([bba213e](https://github.com/Arno2T/LDJS-Projet7/commit/bba213ec370df059c860c41c14226dedfe0e7f1e))
* add SonarQube Cloud analysis ([#5](https://github.com/Arno2T/LDJS-Projet7/issues/5)) ([d597258](https://github.com/Arno2T/LDJS-Projet7/commit/d5972584404831dccf55d051cf50cd31f3b4f20d))
* automate semver releases with release-please ([#31](https://github.com/Arno2T/LDJS-Projet7/issues/31)) ([30341ee](https://github.com/Arno2T/LDJS-Projet7/commit/30341eea3834e099cb6ba6cb6137a9e643a62379))
* block only on runtime dependency vulnerabilities, report dev ones ([#25](https://github.com/Arno2T/LDJS-Projet7/issues/25)) ([8ea375c](https://github.com/Arno2T/LDJS-Projet7/commit/8ea375cc4b75b6736d2a0b274a9fa65960b57e5c))
* build docker images, smoke test the stack and scan with trivy ([#28](https://github.com/Arno2T/LDJS-Projet7/issues/28)) ([f96d6a9](https://github.com/Arno2T/LDJS-Projet7/commit/f96d6a9585a5d83a03f38a47f91170d0131f24bc))
* **deps:** bump SonarSource/sonarqube-scan-action from 8.4.1 to 8.5.0 in the actions group ([#7](https://github.com/Arno2T/LDJS-Projet7/issues/7)) ([4daf5d1](https://github.com/Arno2T/LDJS-Projet7/commit/4daf5d18144d20a39cd709a1b0b8956fcc3c61ec))
* ignore eslint major updates for client until eslint-plugin-react supports v10 ([#23](https://github.com/Arno2T/LDJS-Projet7/issues/23)) ([ff829f1](https://github.com/Arno2T/LDJS-Projet7/commit/ff829f146d479480c5dce1a59c093ed7d5a73c3d))
* ignore out-of-scope major updates in Dependabot ([#18](https://github.com/Arno2T/LDJS-Projet7/issues/18)) ([30bc87a](https://github.com/Arno2T/LDJS-Projet7/commit/30bc87ad2ab69fd8a0049d045c6d01fd4b64c613))
* publish docker server and client images to GHCR ([#29](https://github.com/Arno2T/LDJS-Projet7/issues/29)) ([30fa78c](https://github.com/Arno2T/LDJS-Projet7/commit/30fa78ca07029daaf04b4889da77fb8f2f30af89))
