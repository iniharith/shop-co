"use client";
import React from "react";
import { DataTable } from "../../global/data-table";
import { userColumns as columns, IUser } from "./columns";
import { DataTableSkeleton } from "../../global/table/data-table-skeleton";
import { useUsers } from "@/hooks/useUsers";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface Props {}

const UsersList = (props: Props) => {
  // Showcasing the use of search params cache in nested RSCs

  const { data, isPending, refetch, isFetching } = useUsers();

  if (isPending) return <DataTableSkeleton />;

  if (data) {
    const users = data.users || [];
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-end w-full">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh Users
          </Button>
        </div>
        <DataTable search={"name"} data={users} columns={columns} />
      </div>
    );
  }
  return null;
};

export default UsersList;
