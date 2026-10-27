import { useEffect, useRef, useState } from "react"
import { Share2, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const APP_URL = "https://attendify-d4a2a.web.app"
const IMAGE_PATH = "/attendify-promo.png"
const IMAGE_NAME = "Attendify_Your_College_Companion.png"

const SHARE_TEXT = `🎓 *Attendify – Your College Companion*

Track your college life in one place! 🚀

✅ Attendance & safe-to-bunk calculator
🚨 Low-attendance alerts
📅 Assignments & Google Calendar sync
📸 Timetable, notes & PDFs
📊 Attendance reports (PDF/CSV)
☁️ Cloud sync

📱 Use it on your phone or add it to your home screen!
🔗 Try Attendify: ${APP_URL}`

async function loadImageBlob(): Promise<Blob> {
    const res = await fetch(IMAGE_PATH, { cache: "force-cache" })
    if (!res.ok) throw new Error("Failed to load image")
    return res.blob()
}

async function copyText(text: string): Promise<boolean> {
    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text)
            return true
        }
    } catch {
        // fall through to legacy approach
    }
    try {
        const ta = document.createElement("textarea")
        ta.value = text
        ta.style.position = "fixed"
        ta.style.opacity = "0"
        document.body.appendChild(ta)
        ta.select()
        const ok = document.execCommand("copy")
        document.body.removeChild(ta)
        return ok
    } catch {
        return false
    }
}

function downloadImage() {
    const a = document.createElement("a")
    a.href = IMAGE_PATH
    a.download = IMAGE_NAME
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
}

// Phones/tablets only. Desktop browsers (even with navigator.share, e.g. Windows Chrome/Edge)
// hand off to WhatsApp Desktop, which sends shared text and image as two separate messages.
function isMobileDevice(): boolean {
    const ua = navigator.userAgent
    if (/Android|iPhone|iPad|iPod|Mobile/i.test(ua)) return true
    // iPadOS reports a Mac user agent but has multi-touch
    return /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1
}

export function ShareButton() {
    const [loading, setLoading] = useState(false)
    const busy = useRef(false)
    const fileRef = useRef<File | null>(null)

    // Preload the promo image as a File so navigator.share can be called synchronously on tap.
    useEffect(() => {
        if (!isMobileDevice()) return
        let cancelled = false
        loadImageBlob()
            .then((blob) => {
                if (!cancelled) fileRef.current = new File([blob], IMAGE_NAME, { type: blob.type || "image/png" })
            })
            .catch(() => {
                // Falls back to download + copy flow on tap
            })
        return () => {
            cancelled = true
        }
    }, [])

    // Desktop / unsupported: download the image and copy the full caption so the user
    // can attach the image in WhatsApp and paste the caption (one message, user-sent).
    const fallback = async () => {
        const copied = await copyText(SHARE_TEXT)
        downloadImage()
        if (copied) {
            toast.success("Message copied & image downloaded", {
                duration: 15000,
                description:
                    "Attach the Attendify image in WhatsApp, paste the message into the image caption, and send.",
                action: { label: "Download image again", onClick: downloadImage },
            })
        } else {
            toast.error("Image downloaded, but the message couldn't be copied automatically.", {
                duration: 15000,
                description:
                    "Attach the Attendify image in WhatsApp, then type or paste the message into the caption.",
                action: {
                    label: "Retry copy",
                    onClick: async () => {
                        if (await copyText(SHARE_TEXT)) toast.success("Message copied!")
                        else toast.error("Copy blocked by the browser.")
                    },
                },
            })
        }
    }

    const handleShare = async () => {
        if (busy.current) return
        busy.current = true
        setLoading(true)
        const mobile = isMobileDevice()
        const file = fileRef.current
        try {
            if (
                mobile &&
                file &&
                typeof navigator.share === "function" &&
                typeof navigator.canShare === "function" &&
                navigator.canShare({ files: [file] })
            ) {
                // IMPORTANT: no `await` before navigator.share — iOS/Safari-based browsers
                // reject it if the tap's user activation was consumed by earlier async work.
                // Start the backup clipboard copy without awaiting it.
                const copyPromise = copyText(SHARE_TEXT)
                try {
                    await navigator.share({ files: [file], text: SHARE_TEXT, title: "Attendify" })
                    if (await copyPromise) {
                        toast.info("Message copied to clipboard", {
                            description: "If the caption is empty in WhatsApp, long-press the caption box and paste.",
                            duration: 8000,
                        })
                    }
                    return
                } catch (err) {
                    if ((err as DOMException)?.name === "AbortError") {
                        toast.info("Sharing cancelled.")
                        return
                    }
                    // Other errors (e.g. NotAllowedError): use fallback
                }
            }
            await fallback()
        } finally {
            busy.current = false
            setLoading(false)
        }
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={handleShare}
                    disabled={loading}
                    aria-label="Share Attendify"
                    className="rounded-full bg-background/50 border-0 backdrop-blur-sm hover:bg-background/80 transition-colors"
                >
                    {loading ? <Loader2 className="h-[1.2rem] w-[1.2rem] animate-spin" /> : <Share2 className="h-[1.2rem] w-[1.2rem]" />}
                </Button>
            </TooltipTrigger>
            <TooltipContent>Share Attendify</TooltipContent>
        </Tooltip>
    )
}
