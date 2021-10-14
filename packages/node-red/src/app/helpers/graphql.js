import _ from 'lodash'
import { GraphQLClient, gql } from 'graphql-request'

const graphQLClient = new GraphQLClient(`https://${process.env.HASURA_GRAPHQL_DOMAIN}/v1/graphql`, {
    headers: {
        "X-Hasura-Admin-Secret": `${process.env.HASURA_GRAPHQL_TOKEN}`,
    },
})

export async function fetchLabMetadata(lab_uid) {
    const query = gql`
        query getLabByUid($lab_uid: String!) {
            labs(where: {uid: {_eq: $lab_uid}}) {
                uid
                url
            }
        }     
    `;
    const data = await graphQLClient.request(query, {
        lab_uid
    })
    const lab = _.get(data, 'labs.0', {});
    return [
        { key: "url", value: `${lab.url}` },
        { key: "api", value: `${lab.url}/api` },
        { key: "builder", value: `${lab.url}/builder` },
        { key: "swagger", value: `${lab.url}/api/http-api/swagger.json` },
        { key: "dashboard", value: `${lab.url}/api/dashboard` }
    ];
}

export async function fetchLabResources(lab_uid) {
    const query = gql`
        query getLabByUid($lab_uid: String!) {
            labs(where: {uid: {_eq: $lab_uid}}) {
                uid
                url
                project {
                    uid
                    name
                    resources {
                        uid
                        name
                        config
                        type {
                            name
                        }
                    }
                }
            }
        }     
    `;
    const data = await graphQLClient.request(query, {
        lab_uid
    })
    const resources = _.get(data, 'labs.0.project.resources', []);
    return resources;
}