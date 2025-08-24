import { BarChart3, Users, AlertCircle, CheckCircle } from 'lucide-react'

const Dashboard = () => {
  // Datos de ejemplo - luego vendrán del backend
  const stats = [
    { label: 'Total Clientes', value: '245', icon: Users, change: '+12%' },
    { label: 'Reclamos Activos', value: '32', icon: AlertCircle, change: '-5%' },
    { label: 'Reclamos Resueltos', value: '184', icon: CheckCircle, change: '+8%' },
    { label: 'Satisfacción', value: '92%', icon: BarChart3, change: '+3%' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
      
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <stat.icon className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {stat.label}
                  </dt>
                  <dd>
                    <div className="text-lg font-semibold text-gray-900">
                      {stat.value}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-sm text-green-600 font-medium">
                {stat.change}
              </span>
              <span className="text-sm text-gray-500 ml-1">desde el mes pasado</span>
            </div>
          </div>
        ))}
      </div>

      {/* Contenido adicional */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Actividad Reciente</h2>
          <div className="space-y-4">
            <p className="text-gray-600">Aquí se mostrará la actividad reciente del sistema...</p>
          </div>
        </div>
        
        <div className="card">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Reclamos por Estado</h2>
          <div className="space-y-4">
            <p className="text-gray-600">Aquí se mostrarán los reclamos por estado...</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard