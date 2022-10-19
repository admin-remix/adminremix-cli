import got from 'got';

export async function callGraphQL<T>({
  url, query, variables, token
}:{
  url: string;
  query: string;
  variables?: Record<string, string|number>;
  token: string;
}):Promise<T> {
  const data = await got.post<T>(url, {
    json: {
      query,
      variables
    },
    headers: {
      'x-api-key': token
    }
  }).json();
  return data as T;
}