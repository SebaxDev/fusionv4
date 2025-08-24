import { useState, useEffect } from 'react'
import axios from 'axios'

const HealthCheck = () => {
  const [status, setStatus] = useState('checking...')
  const [error, setError] = useState(null)

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await axios.get('/api/health')
        setStatus(response.data.status)
      } catch (err) {
        setError(err.message)
        setStatus('unhealthy')
      }
    }

    checkHealth()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="card max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Health Check</h1>
        <div className="mb-4">
          <span className="font-medium">Backend Status: </span>
          <span className={status === 'healthy' ? 'text-green-600' : 'text-red-600'}>
            {status}
          </span>
        </div>
        {error && (
          <div className="text-red-600 bg-red-50 p-3 rounded-md">
            Error: {error}
          </div>
        )}
      </div>
    </div>
  )
}

export default HealthCheck