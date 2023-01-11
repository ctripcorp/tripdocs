export default function myfetch(url: string, fetchConfig?: any): Promise<object> {
  return new Promise((resolve, reject) => {
    fetch(url, fetchConfig)
      .then((res: any) => res.json())
      .then((response: any) => {
        if (!response.data) {
          resolve(response);
          return;
        }
        const { code, data, message } = response.data;
        if (code === '0' && data) {
          resolve(data);
        } else if (code && code !== '0') {
          if (message) alert!(message);
          reject(response.data);
        } else {
          resolve(response.data);
        }
      })
      .catch((e: { response: { status: number; data: any } }) => {
        console.log('request - api - err:', url, e);
        reject(e?.response?.data);
      });
  });
}
