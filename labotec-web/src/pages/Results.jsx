import React, { useEffect, useState } from 'react'
import api from '../lib/api'
import Table from '../components/Table'
import Modal from '../components/Modal'
import { useAuth } from '../context/AuthContext'

export default function Results() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Form states
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    patientId: '',
    testName: '',
    resultValue: '',
    unit: '',
    releasedAt: ''
  })

  const isPatient = user?.isPaciente && !user?.isAdmin

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await api.get('/api/results', {
        params: { page: 1, pageSize: 50, sortDir: 'desc' }
      })
      setItems(res.data.items || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if(user) fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // --- Handlers ---
  const handleOpenForm = (item) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        patientId: item.patientId,
        testName: item.testName,
        resultValue: item.resultValue,
        unit: item.unit,
        releasedAt: item.releasedAt ? item.releasedAt.slice(0, 16) : ''
      })
    } else {
      setEditingItem(null)
      setFormData({
        patientId: '',
        testName: '',
        resultValue: '',
        unit: '',
        releasedAt: new Date().toISOString().slice(0, 16)
      })
    }
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingItem) {
        await api.put(`/api/results/${editingItem.id}`, formData)
      } else {
        await api.post('/api/results', formData)
      }
      setShowForm(false)
      fetchData()
    } catch (error) {
      alert('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if(!window.confirm('¿Borrar resultado?')) return
    try {
      await api.delete(`/api/results/${id}`)
      fetchData()
    } catch (e) {
      alert('Error')
    }
  }

  // --- Columns ---
  const columns = [
    ...(!isPatient ? [{ key: 'patientName', header: 'Paciente' }] : []),
    { key: 'testName', header: 'Prueba' },
    { key: 'resultValue', header: 'Resultado' },
    { key: 'unit', header: 'Unidad' },
    { 
      key: 'releasedAt', 
      header: 'Fecha',
      render: (row) => new Date(row.releasedAt).toLocaleDateString()
    },
    {
      key: 'pdfUrl',
      header: 'PDF',
      render: (row) => row.pdfUrl ? (
        <a href={row.pdfUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline text-xs">Ver PDF</a>
      ) : <span className="text-gray-400 text-xs">-</span>
    }
  ]

  if (!isPatient) {
    columns.push({
      key: 'actions',
      header: 'Acciones',
      render: (row) => (
        <div className="flex gap-2">
          <button onClick={() => handleOpenForm(row)} className="text-blue-600 text-xs">Editar</button>
          <button onClick={() => handleDelete(row.id)} className="text-red-600 text-xs">Borrar</button>
        </div>
      )
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Resultados de Laboratorio</h2>
        {!isPatient && (
          <button onClick={() => handleOpenForm(null)} className="bg-emerald-600 text-white px-3 py-2 rounded text-sm">
            Nuevo Resultado
          </button>
        )}
      </div>

      {loading ? <p>Cargando...</p> : <Table columns={columns} data={items} rowKey="id"/>}

      {showForm && (
        <Modal title={editingItem ? "Editar" : "Crear"} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-3">
            {!isPatient && (
              <div>
                <label className="text-xs font-bold">ID Paciente</label>
                <input 
                  className="w-full border p-2 rounded"
                  value={formData.patientId}
                  onChange={e => setFormData({...formData, patientId: e.target.value})}
                  required
                />
              </div>
            )}
            <div>
              <label className="text-xs font-bold">Prueba</label>
              <input 
                className="w-full border p-2 rounded"
                value={formData.testName}
                onChange={e => setFormData({...formData, testName: e.target.value})}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold">Valor</label>
                <input 
                  className="w-full border p-2 rounded"
                  value={formData.resultValue}
                  onChange={e => setFormData({...formData, resultValue: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold">Unidad</label>
                <input 
                  className="w-full border p-2 rounded"
                  value={formData.unit}
                  onChange={e => setFormData({...formData, unit: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold">Fecha</label>
              <input 
                type="datetime-local"
                className="w-full border p-2 rounded"
                value={formData.releasedAt}
                onChange={e => setFormData({...formData, releasedAt: e.target.value})}
              />
            </div>
            
            <div className="flex justify-end mt-4">
              <button disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded">
                Guardar
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}