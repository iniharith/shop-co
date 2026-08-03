export interface GlobalSearchTask {
  id: string;
  title: string;
  status: string;
  orderId?: string;
  customerUsername?: string;
  updatedAt?: string;
}

export interface GlobalSearchOrder {
  id: string;
  status: string;
  customerName?: string;
  customerEmail?: string;
  trackingNumber?: string;
  createdAt?: string;
}

export interface GlobalSearchCustomer {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
}

export interface GlobalSearchFile {
  id: string;
  name: string;
  mimetype?: string;
  category?: string;
  taskId?: string;
  orderId?: string;
  userId?: string;
  uploadedAt?: string;
}

export interface GlobalSearchProject {
  id: string;
  title: string;
  description?: string;
  fileCount: number;
  updatedAt?: string;
}

export interface GlobalSearchTracking {
  id: string;
  trackingNumber: string;
  orderId?: string;
  customerName?: string;
  courier?: string;
  status?: string;
  updatedAt?: string;
}

export interface GlobalSearchGroups {
  tasks: GlobalSearchTask[];
  orders: GlobalSearchOrder[];
  customers: GlobalSearchCustomer[];
  files: GlobalSearchFile[];
  projects: GlobalSearchProject[];
  tracking: GlobalSearchTracking[];
}

export type GlobalSearchGroupKey = keyof GlobalSearchGroups;
export type GlobalSearchHasMore = Record<GlobalSearchGroupKey, boolean>;

export interface GlobalSearchResponse {
  success: true;
  query: string;
  groups: GlobalSearchGroups;
  hasMore: GlobalSearchHasMore;
  tookMs: number;
}

export type GlobalSearchHit = {
  [Group in GlobalSearchGroupKey]: {
    group: Group;
    item: GlobalSearchGroups[Group][number];
  };
}[GlobalSearchGroupKey];

export type RecentlyViewedSearchHit = {
  [Group in GlobalSearchGroupKey]: {
    group: Group;
    item: GlobalSearchGroups[Group][number];
    viewedAt: number;
  };
}[GlobalSearchGroupKey];
