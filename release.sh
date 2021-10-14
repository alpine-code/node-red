lerna publish
docker build -t alpcode/node-red ./packages/node-red
docker push alpcode/node-red