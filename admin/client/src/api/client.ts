import axios from 'axios'

const BASE = import.meta.env.VITE_BASE_PATH ?? ''

const client = axios.create({
  baseURL: `${BASE}/api`,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      window.location.href = `${BASE}/login`
    }
    return Promise.reject(err)
  }
)

export default client
