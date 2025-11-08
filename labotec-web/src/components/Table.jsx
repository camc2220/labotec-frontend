import React from 'react'
export default function Table({ columns, data }) {
  return (
    <div className="overflow-x-auto bg-white shadow rounded-xl">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100 text-gray-700">
          <tr>{columns.map(c => (<th key={c.key} className="text-left px-3 py-2 font-medium">{c.header}</th>))}</tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="border-t">
              {columns.map(c => (<td key={c.key} className="px-3 py-2">{c.render ? c.render(row) : row[c.key]}</td>))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
