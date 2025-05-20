### ▶️ 실행 방법

싫랭:
```
docker compose up -d
```
- Gateway: http://localhost:4173
- Auth: http://localhost:5173
- Event: http://localhost:6173

테스트:
```
docker compose -f docker-compose-test-mongo.yml up -d
npm install
npm run test
```

API Docs (Swagger)
- Gateway: http://localhost:4173/docs

> Gateway Swagger에서 각 마이크로 서버의 API Doc(JSON)을 통해 내부 스웨거 UI를 확인할 수 있는 형태로 구성되어 있습니다.



### 📄 각종 문서
- [구현 전 요구사항을 바탕으로 정리, 시각화 등](docs/SETUP.md)
- [프로젝트 아키텍처 구조](docs/architecture.md)
- [콜렉션 설계](docs/erd.md)
- [기타 구현 과정의 고민들](docs/impl_notes.md)