export type Locale = "en" | "ms";

export const messages = {
  en: {
    // ── Navigation ──
    "nav.dashboard": "Dashboard",
    "nav.projects": "Projects",
    "nav.users": "Users",
    "nav.orders": "Orders",
    "nav.artworks": "Artworks",
    "nav.printDrafts": "Print Drafts",
    "nav.tracking": "Tracking",
    "nav.tasks": "Tasks",
    "nav.chat": "Chat",
    "nav.production": "Production",
    "nav.sublimation": "Sublimation",
    "nav.packaging": "Packaging",
    "nav.history": "History",
    "nav.monitoring": "Monitoring",
    "nav.tools": "Tools",
    "nav.schedule": "Schedule",
    "nav.overview": "Overview",

    // ── Dashboard ──
    "dashboard.welcome": "Hi, Welcome back 👋",
    "dashboard.seedData": "Seed Data",
    "dashboard.liveOps": "Live operations",
    "dashboard.liveOpsDesc": "A current view across orders, delivery, and artwork.",
    "dashboard.refresh": "Refresh Dashboard",
    "dashboard.totalOrders": "Total Orders",
    "dashboard.allTime": "All time",
    "dashboard.lifetimeOrders": "Lifetime orders placed",
    "dashboard.deliveryHealth": "Delivery health",
    "dashboard.successRate": "Success Rate",
    "dashboard.delivered": "Delivered",
    "dashboard.totalParcels": "total parcels",
    "dashboard.activeDeliveries": "Active Deliveries",
    "dashboard.totalTasks": "Total Tasks",
    "dashboard.totalFolders": "Total Folders",
    "dashboard.usersOnline": "Users Online",
    "dashboard.parcelFlow": "Parcel flow",
    "dashboard.deliveryStatus": "Delivery Status",
    "dashboard.parcels": "parcels",
    "dashboard.inTransit": "In Transit",
    "dashboard.pending": "Pending",
    "dashboard.failed": "Failed",
    "dashboard.artworkAnalytics": "Artwork analytics",
    "dashboard.filesManaged": "Files Managed",
    "dashboard.storageUsed": "Storage Used",
    "dashboard.pendingReview": "Pending Review",
    "dashboard.loading": "Loading dashboard",

    // ── Tasks ──
    "tasks.title": "Task Management",
    "tasks.description": "Manage and assign tasks for your team",
    "tasks.createTask": "Create Task",
    "tasks.assignee": "Assignee",
    "tasks.status": "Status",
    "tasks.dueDate": "Due Date",
    "tasks.category": "Category",
    "tasks.comments": "Comments",
    "tasks.files": "Files",
    "tasks.activity": "Activity",
    "tasks.unassigned": "Unassigned",
    "tasks.allCategories": "All Categories",
    "tasks.noTasks": "No tasks found",

    // ── Orders ──
    "orders.title": "Orders",
    "orders.description": "Manage customer orders",
    "orders.createOrder": "Create Order",
    "orders.customer": "Customer",
    "orders.total": "Total",
    "orders.status": "Status",
    "orders.date": "Date",
    "orders.noOrders": "No orders found",

    // ── Artworks ──
    "artworks.title": "Artworks",
    "artworks.description": "Manage uploaded artwork files",

    // ── Tracking ──
    "tracking.title": "Tracking",
    "tracking.description": "Track parcels and shipments",

    // ── Chat ──
    "chat.title": "Chat",
    "chat.description": "Messages and conversations",

    // ── Production ──
    "production.title": "Production",
    "production.description": "Production queue management",

    // ── Packaging ──
    "packaging.title": "Packaging",
    "packaging.description": "Packaging queue management",

    // ── History ──
    "history.title": "History",
    "history.description": "Task and order history",

    // ── Monitoring ──
    "monitoring.title": "Monitoring",
    "monitoring.description": "System monitoring and health",

    // ── Tools ──
    "tools.title": "Tools",
    "tools.description": "Admin tools and utilities",
    "tools.auditLog": "Audit Log",
    "tools.auditLogDesc": "Website activity logs",
    "tools.imageUpscaler": "Image Upscaler",
    "tools.s3Browser": "S3 Media Browser",

    // ── Reports ──
    "reports.title": "Reports",
    "reports.staffPerformance": "Staff Performance",
    "reports.monthlyOrders": "Monthly Orders",
    "reports.export": "Export",
    "reports.exporting": "Exporting...",
    "reports.selectStaff": "Select Staff Member",
    "reports.selectMonth": "Select Month",
    "reports.tasksAssigned": "Tasks Assigned",
    "reports.tasksCompleted": "Tasks Completed",
    "reports.avgDesignCycle": "Avg Design Cycle",
    "reports.fileQuantity": "File Quantity",
    "reports.completionRatio": "Completion Ratio",
    "reports.printableReport": "Printable Report",

    // ── Users ──
    "users.title": "Users",
    "users.description": "Manage user accounts",
    "users.createUser": "Create User",
    "users.name": "Name",
    "users.email": "Email",
    "users.role": "Role",
    "users.status": "Status",

    // ── Projects ──
    "projects.title": "Projects",
    "projects.description": "Design project management",
    "projects.createProject": "Create Project",

    // ── Profile ──
    "profile.title": "Profile",
    "profile.settings": "Settings",
    "profile.logout": "Log out",

    // ── Queue Analytics ──
    "queue.title": "Queue Analytics",
    "queue.wip": "Work in Progress",
    "queue.overdue": "Overdue",
    "queue.unassigned": "Unassigned",
    "queue.avgCompletion": "Avg Completion",
    "queue.bottlenecks": "Bottlenecks",
    "queue.staffWorkload": "Staff Workload",

    // ── Server Status ──
    "server.title": "Server Status",
    "server.cpu": "CPU",
    "server.memory": "Memory",
    "server.disk": "Disk",
    "server.uptime": "Uptime",

    // ── Shared UI ──
    "shared.save": "Save",
    "shared.cancel": "Cancel",
    "shared.delete": "Delete",
    "shared.edit": "Edit",
    "shared.search": "Search",
    "shared.loading": "Loading...",
    "shared.noData": "No data",
    "shared.confirm": "Confirm",
    "shared.success": "Success",
    "shared.error": "Error",
    "shared.export": "Export",
    "shared.filter": "Filter",
    "shared.all": "All",
    "shared.back": "Back",
    "shared.next": "Next",
    "shared.previous": "Previous",
    "shared.close": "Close",
    "shared.viewAll": "View All",
    "shared.pageOf": "Page {current} of {total}",
    "shared.totalItems": "{count} items",
    "shared.searchPlaceholder": "Search across admin...",
    "shared.sortBy": "Sort by",
    "shared.dateDesc": "Date: newest first",
    "shared.dateAsc": "Date: oldest first",
    "shared.reset": "Reset",
  },
  ms: {
    // ── Navigation ──
    "nav.dashboard": "Papan Pemuka",
    "nav.projects": "Projek",
    "nav.users": "Pengguna",
    "nav.orders": "Pesanan",
    "nav.artworks": "Artwork",
    "nav.printDrafts": "Draf Cetakan",
    "nav.tracking": "Penjejakan",
    "nav.tasks": "Tugasan",
    "nav.chat": "Sembang",
    "nav.production": "Pengeluaran",
    "nav.sublimation": "Sublimasi",
    "nav.packaging": "Pembungkusan",
    "nav.history": "Sejarah",
    "nav.monitoring": "Pemantauan",
    "nav.tools": "Alatan",
    "nav.schedule": "Jadual",
    "nav.overview": "Gambaran",

    // ── Dashboard ──
    "dashboard.welcome": "Hai, Selamat Kembali 👋",
    "dashboard.seedData": "Data Sampel",
    "dashboard.liveOps": "Operasi Langsung",
    "dashboard.liveOpsDesc": "Pandangan semula pesanan, penghantaran, dan artwork.",
    "dashboard.refresh": "Muat Semula Papan Pemuka",
    "dashboard.totalOrders": "Jumlah Pesanan",
    "dashboard.allTime": "Sepanjang Masa",
    "dashboard.lifetimeOrders": "Pesanan sepanjang masa",
    "dashboard.deliveryHealth": "Kesihatan Penghantaran",
    "dashboard.successRate": "Kadar Kejayaan",
    "dashboard.delivered": "Dihantar",
    "dashboard.totalParcels": "jumlah parcel",
    "dashboard.activeDeliveries": "Penghantaran Aktif",
    "dashboard.totalTasks": "Jumlah Tugasan",
    "dashboard.totalFolders": "Jumlah Folder",
    "dashboard.usersOnline": "Pengguna Dalam Talian",
    "dashboard.parcelFlow": "Aliran Parcel",
    "dashboard.deliveryStatus": "Status Penghantaran",
    "dashboard.parcels": "parcel",
    "dashboard.inTransit": "Dalam Transit",
    "dashboard.pending": "Menunggu",
    "dashboard.failed": "Gagal",
    "dashboard.artworkAnalytics": "Analitik Artwork",
    "dashboard.filesManaged": "Fail Diurus",
    "dashboard.storageUsed": "Storan Digunakan",
    "dashboard.pendingReview": "Belum Disemak",
    "dashboard.loading": "Memuatkan papan pemuka",

    // ── Tasks ──
    "tasks.title": "Pengurusan Tugasan",
    "tasks.description": "Urus dan tetapkan tugasan untuk pasukan anda",
    "tasks.createTask": "Cipta Tugasan",
    "tasks.assignee": "Penugasan",
    "tasks.status": "Status",
    "tasks.dueDate": "Tarikh Akhir",
    "tasks.category": "Kategori",
    "tasks.comments": "Komen",
    "tasks.files": "Fail",
    "tasks.activity": "Aktiviti",
    "tasks.unassigned": "Belum Ditugaskan",
    "tasks.allCategories": "Semua Kategori",
    "tasks.noTasks": "Tiada tugasan ditemui",

    // ── Orders ──
    "orders.title": "Pesanan",
    "orders.description": "Urus pesanan pelanggan",
    "orders.createOrder": "Cipta Pesanan",
    "orders.customer": "Pelanggan",
    "orders.total": "Jumlah",
    "orders.status": "Status",
    "orders.date": "Tarikh",
    "orders.noOrders": "Tiada pesanan ditemui",

    // ── Artworks ──
    "artworks.title": "Artwork",
    "artworks.description": "Urus fail artwork yang dimuat naik",

    // ── Tracking ──
    "tracking.title": "Penjejakan",
    "tracking.description": "Jejak parcel dan penghantaran",

    // ── Chat ──
    "chat.title": "Sembang",
    "chat.description": "Mesej dan perbualan",

    // ── Production ──
    "production.title": "Pengeluaran",
    "production.description": "Pengurusan baris pengeluaran",

    // ── Packaging ──
    "packaging.title": "Pembungkusan",
    "packaging.description": "Pengurusan baris pembungkusan",

    // ── History ──
    "history.title": "Sejarah",
    "history.description": "Sejarah tugasan dan pesanan",

    // ── Monitoring ──
    "monitoring.title": "Pemantauan",
    "monitoring.description": "Pemantauan dan kesihatan sistem",

    // ── Tools ──
    "tools.title": "Alatan",
    "tools.description": "Alatan dan utiliti pentadbir",
    "tools.auditLog": "Log Audit",
    "tools.auditLogDesc": "Log aktiviti laman web",
    "tools.imageUpscaler": "Peningkat Saiz Imej",
    "tools.s3Browser": "Pelayar Media S3",

    // ── Reports ──
    "reports.title": "Laporan",
    "reports.staffPerformance": "Prestasi Kakitangan",
    "reports.monthlyOrders": "Pesanan Bulanan",
    "reports.export": "Eksport",
    "reports.exporting": "Mengeksport...",
    "reports.selectStaff": "Pilih Ahli Kakitangan",
    "reports.selectMonth": "Pilih Bulan",
    "reports.tasksAssigned": "Tugasan Ditugaskan",
    "reports.tasksCompleted": "Tugasan Selesai",
    "reports.avgDesignCycle": "Kitaran Reka Purata",
    "reports.fileQuantity": "Kuantiti Fail",
    "reports.completionRatio": "Nisbah Penyelesaian",
    "reports.printableReport": "Laporan Boleh Cetak",

    // ── Users ──
    "users.title": "Pengguna",
    "users.description": "Urus akaun pengguna",
    "users.createUser": "Cipta Pengguna",
    "users.name": "Nama",
    "users.email": "E-mel",
    "users.role": "Peranan",
    "users.status": "Status",

    // ── Projects ──
    "projects.title": "Projek",
    "projects.description": "Pengurusan projek reka bentuk",
    "projects.createProject": "Cipta Projek",

    // ── Profile ──
    "profile.title": "Profil",
    "profile.settings": "Tetapan",
    "profile.logout": "Log keluar",

    // ── Queue Analytics ──
    "queue.title": "Analitik Baris Ganti",
    "queue.wip": "Dalam Proses",
    "queue.overdue": "Lewat Tarikh",
    "queue.unassigned": "Belum Ditugaskan",
    "queue.avgCompletion": "Purata Penyelesaian",
    "queue.bottlenecks": "Titik Hambatan",
    "queue.staffWorkload": "Beban Kerja Kakitangan",

    // ── Server Status ──
    "server.title": "Status Pelayan",
    "server.cpu": "CPU",
    "server.memory": "Memori",
    "server.disk": "Cakera",
    "server.uptime": "Masa Hidup",

    // ── Shared UI ──
    "shared.save": "Simpan",
    "shared.cancel": "Batal",
    "shared.delete": "Padam",
    "shared.edit": "Sunting",
    "shared.search": "Cari",
    "shared.loading": "Memuatkan...",
    "shared.noData": "Tiada data",
    "shared.confirm": "Sahkan",
    "shared.success": "Berjaya",
    "shared.error": "Ralat",
    "shared.export": "Eksport",
    "shared.filter": "Tapis",
    "shared.all": "Semua",
    "shared.back": "Kembali",
    "shared.next": "Seterusnya",
    "shared.previous": "Sebelumnya",
    "shared.close": "Tutup",
    "shared.viewAll": "Lihat Semua",
    "shared.pageOf": "Halaman {current} daripada {total}",
    "shared.totalItems": "{count} item",
    "shared.searchPlaceholder": "Cari di seluruh admin...",
    "shared.sortBy": "Susun mengikut",
    "shared.dateDesc": "Tarikh: terkini dahulu",
    "shared.dateAsc": "Tarikh: terlama dahulu",
    "shared.reset": "Set Semula",
  },
} as const;

export type MessageKey = keyof typeof messages.en;
