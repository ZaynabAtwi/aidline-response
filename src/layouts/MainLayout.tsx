import { AnnouncementBanner } from "@/components/AnnouncementBanner";

// Inside your layout JSX, add at the very top:
<div className="flex flex-col h-screen">
  <AnnouncementBanner />   {/* 👈 Add this */}
  <main className="flex-1 overflow-y-auto">
    <Outlet />
  </main>
  <BottomNav />
</div>
