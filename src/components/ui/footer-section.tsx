'use client';
import React from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { FacebookIcon, FrameIcon, InstagramIcon, LinkedinIcon, YoutubeIcon, ArrowUpRight } from 'lucide-react';

interface FooterLink {
	title: string;
	href: string;
	icon?: React.ComponentType<{ className?: string }>;
}

interface FooterSection {
	label: string;
	links: FooterLink[];
}

const footerLinks: FooterSection[] = [
	{
		label: 'Product',
		links: [
			{ title: 'Features', href: '#features' },
			{ title: 'Templates', href: '#templates' },
			{ title: 'Integrations', href: '#integrations' },
			{ title: 'Updates', href: '#updates' },
		],
	},
	{
		label: 'Company',
		links: [
			{ title: 'About', href: '/about' },
			{ title: 'Careers', href: '/careers' },
			{ title: 'Privacy Policy', href: '/privacy' },
			{ title: 'Terms of Service', href: '/terms' },
		],
	},
	{
		label: 'Resources',
		links: [
			{ title: 'Docs', href: '/docs' },
			{ title: 'Guides', href: '/guides' },
			{ title: 'Support', href: '/support' },
			{ title: 'Contact', href: '/contact' },
		],
	},
];

export function Footer() {
	return (
		<footer className="relative w-full mt-32 overflow-hidden">
			<div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/[0.02] pointer-events-none" />
			<div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
			<div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[100px] bg-white/[0.05] blur-[100px] rounded-full pointer-events-none" />

			<div className="relative z-10 max-w-7xl mx-auto px-6 py-16 md:py-24">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
					<AnimatedContainer className="lg:col-span-2 space-y-8">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white to-neutral-500 flex items-center justify-center shadow-lg shadow-white/10">
								<div className="w-4 h-4 rounded-full bg-black" />
							</div>
							<span className="text-white font-bold text-2xl tracking-tight">Brand</span>
						</div>
						<p className="text-neutral-400 text-base max-w-sm leading-relaxed font-light">
							Design the future with our premium components and next-generation website templates. Built for modern teams.
						</p>
						<div className="flex items-center gap-4 pt-4">
							{[FacebookIcon, InstagramIcon, LinkedinIcon, YoutubeIcon].map((Icon, i) => (
								<a key={i} href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 hover:scale-110 transition-all duration-300">
									<Icon className="size-4" />
								</a>
							))}
						</div>
					</AnimatedContainer>

					<div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-8">
						{footerLinks.map((section, index) => (
							<AnimatedContainer key={section.label} delay={0.1 + index * 0.1}>
								<h3 className="text-sm text-white font-semibold tracking-wider">{section.label}</h3>
								<ul className="mt-6 space-y-4">
									{section.links.map((link) => (
										<li key={link.title}>
											<a
												href={link.href}
												className="group inline-flex items-center text-neutral-400 hover:text-white transition-colors duration-300 text-sm font-light"
											>
												{link.title}
												<ArrowUpRight className="size-3 ml-1 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all duration-300" />
											</a>
										</li>
									))}
								</ul>
							</AnimatedContainer>
						))}
					</div>
				</div>

				<AnimatedContainer delay={0.4} className="mt-24 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
					<p className="text-neutral-500 text-sm font-light">
						© 2026 Brand Inc. All rights reserved.
					</p>
					<div className="flex items-center gap-6 text-sm font-light text-neutral-500">
						<a href="#" className="hover:text-white transition-colors">Privacy</a>
						<a href="#" className="hover:text-white transition-colors">Terms</a>
						<a href="#" className="hover:text-white transition-colors">Cookies</a>
					</div>
				</AnimatedContainer>
			</div>
		</footer>
	);
}

type ViewAnimationProps = {
	delay?: number;
	className?: ComponentProps<typeof motion.div>['className'];
	children: ReactNode;
	key?: string | number;
};

function AnimatedContainer({ className, delay = 0.1, children }: ViewAnimationProps) {
	const shouldReduceMotion = useReducedMotion();

	if (shouldReduceMotion) {
		return <div className={className}>{children}</div>;
	}

	return (
		<motion.div
			initial={{ filter: 'blur(10px)', y: 20, opacity: 0 }}
			whileInView={{ filter: 'blur(0px)', y: 0, opacity: 1 }}
			viewport={{ once: true, margin: "-50px" }}
			transition={{ delay, duration: 0.8, ease: "easeOut" }}
			className={className}
		>
			{children}
		</motion.div>
	);
}
