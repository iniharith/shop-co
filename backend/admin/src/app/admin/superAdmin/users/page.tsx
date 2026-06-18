"use client";
import PageContainer from "@/components/layout/page-container";
import UsersList from "@/components/table/users/usersList";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { SearchParams } from "nuqs/server";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserFormModal } from "@/components/table/users/UserFormModal";
import { useState } from "react";

type pageProps = {
  searchParams: Promise<SearchParams>;
};

export default function Page(props: pageProps) {
  const [createModalOpen, setCreateModalOpen] = useState(false);

  return (
    <>
      <PageContainer scrollable={true}>
        <div className="flex flex-1 flex-col space-y-4">
          <div className="flex items-start justify-between">
            <Heading title="Users 🫰" description="Data Listing And Actions " />
            <div className="flex  w-1/2 items-center justify-end gap-2">
              <div className="relative w-1/2 flex justify-end">
                <Button onClick={() => setCreateModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Add User
                </Button>
              </div>
            </div>
          </div>
          <Separator />
          <UsersList />
        </div>
      </PageContainer>

      <UserFormModal 
        open={createModalOpen} 
        onOpenChange={setCreateModalOpen} 
      />
    </>
  );
}
