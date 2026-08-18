"use client";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import AxiosInstance from "@/utils/axios";

const API = process.env.NEXT_PUBLIC_API_URL || "";

export interface GanttTask {
  id: string;
  title: string;
  status: string;
  category: string;
  assignee: string;
  createdAt: string;
  dueDate: string | null;
  completedAt: string | null;
  fileCount: number;
}

export function useGanttTasks(filters?: { startDate?: string; endDate?: string; category?: string; assignee?: string }) {
  const { data: session } = useSession();
  const token = session?.user?.token || "";

  return useQuery({
    queryKey: ["gantt", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.startDate) params.set("startDate", filters.startDate);
      if (filters?.endDate) params.set("endDate", filters.endDate);
      if (filters?.category) params.set("category", filters.category);
      if (filters?.assignee) params.set("assignee", filters.assignee);
      const response = await AxiosInstance(token).get(`${API}/api/tasks/gantt?${params.toString()}`);
      return response.data.data as GanttTask[];
    },
    enabled: !!token,
    refetchInterval: 30000,
  });
}
