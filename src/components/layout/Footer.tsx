import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
    return (
        <footer className="relative bg-[#828221] pt-16 pb-10 overflow-hidden text-white">

            {/* Background Decor */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <div className="ui-footer-shell relative z-10">

                {/* TOP ROW: Brand + Contact + Map */}
                <div className="ui-footer-grid">

                    {/* Col 1: Brand */}
                    <div className="space-y-6">
                        <div className="flex items-center">
                            <Image src="/logo-pharmacy.png" alt="สภาเภสัชกรรม - The Pharmacy Council of Thailand" width={220} height={52} className="h-18 w-auto object-contain" />
                        </div>

                        {/* Socials */}
                        <div className="flex gap-3 pt-1">
                            <a
                                href="https://www.facebook.com/thaipharmacycouncil"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:bg-[#1877F2] hover:border-[#1877F2] hover:scale-110 transition-all duration-300"
                                aria-label="Facebook"
                            >
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" /></svg>
                            </a>
                            <a
                                href="https://www.instagram.com/pharmacycouncilth/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] hover:border-[#dc2743] hover:scale-110 transition-all duration-300"
                                aria-label="Instagram"
                            >
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772 4.902 4.902 0 011.772-1.153c.636-.247 1.363-.416 2.427-.465 1.067-.047 1.407-.06 4.123-.06h.08zm-1.669.991c-2.618 0-2.924.01-3.957.058-.971.045-1.503.207-1.855.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.886-.344 1.855-.047 1.035-.058 1.341-.058 3.96v.625c0 2.627.011 2.933.058 3.967.045.961.207 1.493.344 1.845.182.467.398.8.748 1.15.35.35.683.566 1.15.748.353.137.886.3 1.855.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.886.344-1.855.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.886-.3-1.855-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" /></svg>
                            </a>
                            <a
                                href="https://www.pharmacycouncil.org"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/25 hover:border-white/40 hover:scale-110 transition-all duration-300"
                                aria-label="Website"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Col 2: Contact */}
                    <div className="space-y-5">
                        <h4 className="text-sm font-black uppercase tracking-widest text-white/50">
                            ติดต่อ
                        </h4>
                        <div className="space-y-4">
                            <div className="flex gap-3 items-start">
                                <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm shrink-0 mt-0.5">📍</span>
                                <p className="text-sm leading-relaxed text-white/70">
                                    สภาเภสัชกรรม อาคาร 6 ชั้น 7 ตึกสำนักงานปลัดกระทรวงสาธารณสุข ถ.ติวานนท์ อ.เมือง จ.นนทบุรี 11000
                                </p>
                            </div>
                            <div className="flex gap-3 items-center">
                                <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm shrink-0">📞</span>
                                <a href="tel:025919992" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
                                    0 2591 9992
                                </a>
                            </div>
                            <div className="flex gap-3 items-center">
                                <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm shrink-0">✉️</span>
                                <a href="mailto:pharthai@pharmacycouncil.org" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
                                    pharthai@pharmacycouncil.org
                                </a>
                            </div>
                            <div className="flex gap-3 items-center">
                                <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm shrink-0">🌐</span>
                                <a href="https://www.pharmacycouncil.org" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
                                    www.pharmacycouncil.org
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Col 3: Map */}
                    <div className="ui-footer-map rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative group">
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3873.8620801190245!2d100.52762687468208!3d13.847316186554584!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30e29b5cb4ca105b%3A0xb3aaa2c0ba72d485!2z4Liq4Lig4Liy4LmA4Lig4Liq4Lix4LiK4LiB4Lij4Lij4Lih!5e0!3m2!1sth!2sth!4v1771299997803!5m2!1sth!2sth"
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen={true}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            className="grayscale group-hover:grayscale-0 transition-all duration-700"
                        />
                    </div>

                </div>

                {/* Bottom Bar */}
                <div className="ui-footer-bottom pt-8 border-t border-white/20">
                    <div>
                        <p className="text-xs font-medium text-white/60">© {new Date().getFullYear()} The Pharmacy Council of Thailand. All rights reserved.</p>
                        <p className="text-xs text-white/40 mt-0.5">สภาเภสัชกรรม</p>
                    </div>

                    <div className="ui-footer-links gap-2">
                        {[
                            { label: 'หน้าหลัก', href: '/' },
                            { label: 'งานประชุม', href: '/events' },
                            { label: 'เกี่ยวกับ', href: '/about' },
                            { label: 'ติดต่อ', href: '/contact' },
                            { label: 'Terms', href: '/terms' },
                            { label: 'Privacy', href: '/privacy' },
                        ].map((item) => (
                            <Link key={item.label} href={item.href} className="px-3 py-1 rounded-lg hover:bg-white/10 text-xs font-medium text-white/60 hover:text-white transition-colors">
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </div>

            </div>
        </footer>
    );
}
