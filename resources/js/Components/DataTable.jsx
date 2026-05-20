import {
    ChevronDownIcon,
    ChevronUpIcon,
} from '@heroicons/react/20/solid';
import { ArrowsUpDownIcon } from '@heroicons/react/24/outline';
import {
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { useState } from 'react';

const MONDAY_TEXT = '#676879';
const MONDAY_TEXT_DARK = '#323338';
const MONDAY_BLUE = '#0073ea';

/**
 * Sortable header — monday.com typography & accent.
 *
 * @param {{ column: import('@tanstack/react-table').Column<any, unknown>; children: import('react').ReactNode }} props
 */
export function DataTableSortHeader({ column, children }) {
    if (!column.getCanSort()) {
        return (
            <span
                className="text-[11px] font-semibold uppercase tracking-wide"
                style={{ color: MONDAY_TEXT }}
            >
                {children}
            </span>
        );
    }

    const sort = column.getIsSorted();

    return (
        <button
            type="button"
            className="group inline-flex w-full min-w-0 items-center justify-between gap-2 rounded-md px-1 py-0.5 text-left text-[11px] font-semibold uppercase tracking-wide outline-none transition-colors hover:bg-[#e6e9ef]/80 focus-visible:ring-2 focus-visible:ring-[#0073ea] focus-visible:ring-offset-1"
            style={{ color: MONDAY_TEXT_DARK }}
            onClick={column.getToggleSortingHandler()}
        >
            <span className="truncate">{children}</span>
            <span className="inline-flex shrink-0">
                {sort === 'asc' ? (
                    <ChevronUpIcon
                        className="h-4 w-4"
                        style={{ color: MONDAY_BLUE }}
                        aria-hidden
                    />
                ) : sort === 'desc' ? (
                    <ChevronDownIcon
                        className="h-4 w-4"
                        style={{ color: MONDAY_BLUE }}
                        aria-hidden
                    />
                ) : (
                    <ArrowsUpDownIcon
                        className="h-4 w-4 text-[#c5c7d0] group-hover:text-[#676879]"
                        aria-hidden
                    />
                )}
            </span>
        </button>
    );
}

function cellAlignClass(meta) {
    if (meta?.align === 'right') {
        return 'text-end';
    }
    if (meta?.align === 'center') {
        return 'text-center';
    }
    return 'text-start';
}

/**
 * monday.com–inspired worktable: airy rows, soft dividers.
 *
 * @template TData
 * @param {{
 *   data: TData[];
 *   columns: import('@tanstack/react-table').ColumnDef<TData, any>[];
 *   emptyMessage: import('react').ReactNode;
 *   getRowId?: (originalRow: TData, index: number, parent?: unknown) => string;
 *   onRowClick?: (row: TData) => void;
 * }} props
 */
export default function DataTable({
    data,
    columns,
    emptyMessage,
    getRowId,
    onRowClick,
}) {
    const [sorting, setSorting] = useState([]);

    const table = useReactTable({
        data,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getRowId:
            getRowId ??
            ((row, index) => {
                const id = row?.id;
                if (id != null && id !== '') {
                    return String(id);
                }
                return String(index);
            }),
    });

    if (!data.length) {
        return (
            <div className="border-t border-[#e6e9ef] bg-white px-6 py-12 text-center text-sm text-[#676879]">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className="relative bg-white">
            <div className="max-h-[min(68vh,40rem)] overflow-auto">
                <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
                    <thead className="sticky top-0 z-10 border-b border-[#e6e9ef] bg-[#fafbfc]">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    const align = cellAlignClass(
                                        header.column.columnDef.meta,
                                    );
                                    return (
                                        <th
                                            key={header.id}
                                            scope="col"
                                            className={
                                                'whitespace-nowrap px-4 py-2.5 align-middle ' +
                                                align
                                            }
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                      header.column.columnDef
                                                          .header,
                                                      header.getContext(),
                                                  )}
                                        </th>
                                    );
                                })}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.map((row) => (
                            <tr
                                key={row.id}
                                className={
                                    'group border-b border-[#f0f1f5] transition-colors last:border-b-0 hover:bg-[#f6f7fb] ' +
                                    (onRowClick ? 'cursor-pointer' : '')
                                }
                                onClick={
                                    onRowClick
                                        ? () => onRowClick(row.original)
                                        : undefined
                                }
                                onKeyDown={
                                    onRowClick
                                        ? (e) => {
                                              if (
                                                  e.key === 'Enter' ||
                                                  e.key === ' '
                                              ) {
                                                  e.preventDefault();
                                                  onRowClick(row.original);
                                              }
                                          }
                                        : undefined
                                }
                                tabIndex={onRowClick ? 0 : undefined}
                                role={onRowClick ? 'button' : undefined}
                            >
                                {row.getVisibleCells().map((cell) => {
                                    const align = cellAlignClass(
                                        cell.column.columnDef.meta,
                                    );
                                    return (
                                        <td
                                            key={cell.id}
                                            className={
                                                'px-4 py-3 align-middle ' +
                                                align
                                            }
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext(),
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
