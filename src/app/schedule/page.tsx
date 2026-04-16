'use client';

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function SchedulePage() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />

            <section className="pt-32 pb-20 px-6">
                <div className="container mx-auto">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl font-bold mb-4">Event Schedule</h1>
                        <p className="text-gray-400">Follow the timeline of our conference.</p>
                    </div>

                    <div className="max-w-3xl mx-auto space-y-8">
                        {[
                            { time: "09:00 AM", title: "Opening Ceremony", type: "Main Stage" },
                            { time: "10:30 AM", title: "Keynote: Future of Pharmacy", type: "Hall A" },
                            { time: "12:00 PM", title: "Lunch Break", type: "Cafeteria" },
                            { time: "01:00 PM", title: "Workshops", type: "Multiple Rooms" },
                            { time: "04:00 PM", title: "Panel Discussion", type: "Main Stage" },
                        ].map((item, i) => (
                            <div key={i} className="flex gap-6 group">
                                <div className="w-24 text-right pt-2 font-mono text-[#8a8a00]">{item.time}</div>
                                <div className="relative border-l border-white/10 pl-8 pb-8 flex-1">
                                    <div className="absolute -left-[5px] top-3 w-2.5 h-2.5 rounded-full bg-[#8a8a00] ring-4 ring-background group-hover:ring-[#737300] transition-all" />
                                    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:border-[#8a8a00]/50 transition-all">
                                        <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                                        <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-xs font-medium">
                                            {item.type}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
