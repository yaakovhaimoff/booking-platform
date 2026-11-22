export default function ListFilters({ label, search, onSearch, placeholder, filterLabel, filterValue, onFilter, filterOptions, count, total }) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-3">
      <input
        type="search"
        aria-label={`Search ${label}`}
        value={search}
        onChange={event => onSearch(event.target.value)}
        placeholder={placeholder}
        className="w-full sm:w-72 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      {filterOptions && (
        <select
          aria-label={filterLabel}
          value={filterValue}
          onChange={event => onFilter(event.target.value)}
          className="rounded-md border border-gray-300 px-2 py-1.5 text-sm bg-white"
        >
          {filterOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      )}
      <span className="text-xs text-gray-500">Showing {count} of {total}</span>
    </div>
  )
}
