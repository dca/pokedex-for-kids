# 建置：靜態內容（internal/content/data）需要先由 npm run content 產生並提交
FROM golang:1.26-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/game-api ./cmd/game-api

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /out/game-api /usr/local/bin/game-api
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/game-api"]
CMD ["serve"]
