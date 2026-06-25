'use client'

import { useState, useMemo } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import EquipmentCard from '@/components/equipment/EquipmentCard'
import { Equipment, Category, EquipmentStatus } from '@/lib/types'

interface Props {
  equipment: Equipment[]
  categories: Category[]
}

const statusOptions: { value: EquipmentStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'available', label: 'Available' },
  { value: 'borrowed', label: 'Borrowed' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'maintenance', label: 'Maintenance' },
]

export default function EquipmentListClient({ equipment, categories }: Props) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  const filtered = useMemo(() => {
    return equipment.filter(e => {
      const matchSearch =
        !search ||
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        (e.serial_no ?? '').toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || e.status === statusFilter
      const matchCategory = categoryFilter === 'all' || e.category_id === categoryFilter
      return matchSearch && matchStatus && matchCategory
    })
  }, [equipment, search, statusFilter, categoryFilter])

  const hasActiveFilters = statusFilter !== 'all' || categoryFilter !== 'all'

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or serial..."
            className="input-base pl-9"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-3 rounded-xl border transition-all ${
            hasActiveFilters || showFilters
              ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400'
              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card p-4 space-y-3">
          {/* Status filter */}
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Status</p>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setStatusFilter(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    statusFilter === opt.value
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category filter */}
          {categories.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Category</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCategoryFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    categoryFilter === 'all'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  All
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                      categoryFilter === cat.id
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {hasActiveFilters && (
            <button
              onClick={() => { setStatusFilter('all'); setCategoryFilter('all') }}
              className="flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-700 font-medium"
            >
              <X className="w-3 h-3" /> Clear filters
            </button>
          )}
        </div>
      )}

      {/* Results */}
      <p className="text-xs text-slate-400">{filtered.length} item{filtered.length !== 1 ? 's' : ''}</p>

      {filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <Search className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="font-medium text-slate-500">No equipment found</p>
          <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((eq, i) => (
            <EquipmentCard key={eq.id} equipment={eq} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
