// components/columns.tsx

export const columns = [
  {
    accessorKey: "created_at",
    header: "Sana",
    cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
  },
  {
    accessorKey: "department_id",
    header: "Bo‘lim",
    cell: ({ row }) => row.original.departament_id || "Noma'lum",
  },
  {
    accessorKey: "sum",
    header: "Summa",
    cell: ({ row }) => `${row.original.sum.toLocaleString()} so‘m`,
  },
  {
    accessorKey: "description",
    header: "Tavsif",
  },
];
