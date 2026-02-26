"use client";

export function SidebarCloseButton() {
  return (
    <button
      className="btn btn-ghost btn-circle absolute right-2 top-2 z-50 lg:hidden"
      onClick={() =>
        (document.getElementById("left-sidebar-drawer") as HTMLInputElement)?.click()
      }
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className="w-5 h-5"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}
