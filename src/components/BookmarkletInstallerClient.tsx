"use client"

import dynamic from "next/dynamic"

const BookmarkletInstaller = dynamic(() => import("@/components/BookmarkletInstaller"), { ssr: false })

export default function BookmarkletInstallerClient() {
  return <BookmarkletInstaller />
}
