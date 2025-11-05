
import React, { useState, useMemo } from 'react';
import { IconArrowUp, IconArrowDown } from './Icons';

/**
 * Props for the TableView component.
 * @property data - An array of objects to be displayed in the table.
 */
interface TableViewProps {
  data: any[];
}

/**
 * A component that renders a JSON array of objects into a sortable and filterable table.
 * It dynamically generates columns from the keys of the objects.
 * @param {TableViewProps} props - The props for the component.
 * @returns {JSX.Element} The rendered table view.
 */
const TableView: React.FC<TableViewProps> = ({ data }) => {
  const [filter, setFilter] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);

  const headers = useMemo(() => {
    if (data.length === 0) return [];
    const headerSet = new Set<string>();
    data.forEach(row => {
        Object.keys(row).forEach(key => headerSet.add(key));
    });
    return Array.from(headerSet);
  }, [data]);

  const filteredData = useMemo(() => {
    if (!filter) return data;
    const lowercasedFilter = filter.toLowerCase();
    return data.filter(row =>
      Object.values(row).some(value =>
        String(value).toLowerCase().includes(lowercasedFilter)
      )
    );
  }, [data, filter]);

  const sortedData = useMemo(() => {
    let sortableItems = [...filteredData];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        
        if (valA < valB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="p-4">
      <input
        type="text"
        placeholder="Filter table..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="mb-4 p-2 w-full max-w-sm bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-md focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent focus:outline-none"
      />
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-light-border dark:divide-dark-border">
          <thead className="bg-light-surface dark:bg-dark-surface">
            <tr>
              {headers.map((key) => (
                <th
                  key={key}
                  scope="col"
                  onClick={() => requestSort(key)}
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {key}
                    {sortConfig?.key === key && (
                      sortConfig.direction === 'ascending' ? <IconArrowUp className="w-4 h-4" /> : <IconArrowDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-light-bg dark:bg-dark-bg divide-y divide-light-border dark:divide-dark-border">
            {sortedData.map((row, index) => (
              <tr key={index} className="hover:bg-light-surface dark:hover:bg-dark-surface transition-colors">
                {headers.map((header) => (
                  <td key={header} className="px-6 py-4 whitespace-nowrap text-sm">
                    {typeof row[header] === 'object' && row[header] !== null ? JSON.stringify(row[header]) : String(row[header] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableView;
