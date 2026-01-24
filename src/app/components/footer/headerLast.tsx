import React from "react";
import Link from "next/link";
import {
  Github,
  Instagram,
  Mail,
  ArrowUp,
  Heart,
  Zap,
  Sparkles,
  Globe,
  Linkedin,
  Twitter,
} from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-gray-100 bg-white pt-5  dark:border-white/[0.08] dark:bg-[#030712]">
      {/* Dynamic Background Blobs */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[5%] h-[400px] w-[400px] rounded-full bg-red-500/5 blur-[120px] dark:bg-red-500/10" />
        <div className="absolute -bottom-[10%] -left-[5%] h-[400px] w-[400px] rounded-full bg-blue-500/5 blur-[120px] dark:bg-purple-500/10" />
      </div>

      <div className="mx-auto max-w-8xl p-5 m-5">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-8">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-orange-500 shadow-lg shadow-red-500/20 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                <span className="text-xl font-bold text-white italic">A</span>
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-red-600 to-orange-500 opacity-0 blur-md transition-opacity group-hover:opacity-40" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                  Abdo Dolh
                </span>
                <span className="text-xs font-semibold uppercase tracking-widest text-red-600 dark:text-red-400">
                  Full Stack Developer
                </span>
              </div>
            </Link>

            <p className="max-w-sm text-base leading-relaxed text-gray-600 dark:text-gray-400">
              Building digital products that combine functional excellence with
              aesthetic precision. Available for high-impact collaborations.
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                </span>
                Ready for new projects
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-gray-400 uppercase tracking-tight">
                <Globe size={14} />
                <span>UTC+1 • Remote Worldwide</span>
              </div>
            </div>
          </div>


          {/* Social Links */}
          <div className="lg:col-span-2">
            <h3 className="mb-6 text-sm font-bold uppercase tracking-widest text-gray-900 dark:text-white">
              Social
            </h3>
            <ul className="space-y-4">
              <SocialLink icon={<Github size={18} />} label="GitHub" href="#" />
              <SocialLink
                icon={<Linkedin size={18} />}
                label="LinkedIn"
                href=""
              />
              <SocialLink
                icon={<Twitter size={18} />}
                label="Twitter"
                href="#"
              />
            </ul>
          </div>

          {/* Contact Card */}
          <div className="lg:col-span-4">
            <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-gray-50/50 p-8 dark:border-white/[0.05] dark:bg-white/[0.02]">
              <Sparkles
                className="absolute -right-2 -top-2 text-orange-500/20"
                size={64}
              />
              <h3 className="relative text-lg font-bold text-gray-900 dark:text-white">
                Start a conversation
              </h3>
              <p className="mt-2 mb-6 text-sm text-gray-600 dark:text-gray-400">
                Have an idea? Let's turn it into something incredible.
              </p>
              <a
                href="abdodolh14141@gmail.com"
                className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-900 py-4 text-sm font-bold text-white transition-all hover:bg-red-600 active:scale-95 dark:bg-white dark:text-gray-900 dark:hover:bg-red-500 dark:hover:text-white"
              >
                <Mail size={18} />
                Get in Touch
                <ArrowUp
                  size={18}
                  className="rotate-45 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-20 flex flex-col items-center justify-between gap-6 border-t border-gray-100 pt-10 dark:border-white/[0.05] md:flex-row">
          <div className="flex flex-col items-center gap-2 md:items-start md:gap-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              © {currentYear} Abdulruhman Adel. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Made with</span>
              <Heart size={12} className="fill-red-500 text-red-500" />
              <span>in Egypt</span>
            </div>
          </div>

          
        </div>
      </div>
    </footer>
  );
}

function SocialLink({ icon, label, href }: any) {
  return (
    <li>
      <a
        href={href}
        className="group flex items-center gap-3 text-gray-600 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 transition-colors group-hover:bg-red-50 dark:bg-white/[0.03] dark:group-hover:bg-red-500/10">
          {React.cloneElement(icon, { size: 16 })}
        </span>
        <span className="text-sm font-medium">{label}</span>
      </a>
    </li>
  );
}
