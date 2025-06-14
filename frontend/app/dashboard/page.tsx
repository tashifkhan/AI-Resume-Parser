"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
	FileText,
	Users,
	TrendingUp,
	Mail,
	MessageSquare,
	User,
	ArrowRight,
	ArrowLeft,
	Briefcase,
	Target,
	Clock,
	Star,
	BarChart3,
	Calendar,
	CheckCircle,
	PlusCircle,
	Zap,
	Award,
	Edit,
	Trash2,
	Eye,
	Copy,
	X,
} from "lucide-react";
import Link from "next/link";
import { Loader, LoaderOverlay } from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DashboardData {
	user: {
		name: string;
		email: string;
		image?: string;
	};
	stats: {
		totalResumes: number;
		totalColdMails: number;
		totalInterviews: number;
	};
	recentActivity: Array<{
		id: string;
		type: "resume" | "cold_mail" | "interview";
		title: string;
		description: string;
		date: string;
	}>;
	resumes: Array<{
		id: string;
		customName: string;
		uploadDate: string;
		predictedField?: string;
		candidateName?: string;
	}>;
}

interface InterviewSession {
	id: string;
	role: string;
	companyName: string;
	createdAt: string;
	questionsAndAnswers: Array<{
		question: string;
		answer: string;
	}>;
}

interface ColdMailSession {
	id: string;
	recipientName: string;
	recipientDesignation: string;
	companyName: string;
	createdAt: string;
	emails: Array<{
		id: string;
		subject: string;
		body: string;
		createdAt: string;
	}>;
}

export default function DashboardPage() {
	const { data: session, status } = useSession();
	const router = useRouter();
	const [isPageLoading, setIsPageLoading] = useState(true);
	const [currentTime, setCurrentTime] = useState("");
	const [dashboardData, setDashboardData] = useState<DashboardData | null>(
		null
	);
	const [isLoadingData, setIsLoadingData] = useState(true);
	const [showResumesModal, setShowResumesModal] = useState(false);
	const [editingResume, setEditingResume] = useState<{
		id: string;
		name: string;
	} | null>(null);
	const [newResumeName, setNewResumeName] = useState("");
	const [deletingResume, setDeletingResume] = useState<{
		id: string;
		name: string;
	} | null>(null);
	const [showInterviewsModal, setShowInterviewsModal] = useState(false);
	const [showColdMailsModal, setShowColdMailsModal] = useState(false);
	const [interviewsData, setInterviewsData] = useState<InterviewSession[]>([]);
	const [coldMailsData, setColdMailsData] = useState<ColdMailSession[]>([]);
	const [isLoadingInterviews, setIsLoadingInterviews] = useState(false);
	const [isLoadingColdMails, setIsLoadingColdMails] = useState(false);
	const [deletingInterview, setDeletingInterview] = useState<{
		id: string;
		role: string;
		companyName: string;
	} | null>(null);
	const [deletingColdMail, setDeletingColdMail] = useState<{
		id: string;
		recipientName: string;
		companyName: string;
	} | null>(null);
	const { toast } = useToast();

	// Fetch dashboard data
	const fetchDashboardData = async () => {
		try {
			setIsLoadingData(true);
			const response = await fetch("/api/dashboard");
			const result = await response.json();

			if (result.success) {
				setDashboardData(result.data);
			} else {
				toast({
					title: "Error",
					description: "Failed to load dashboard data",
					variant: "destructive",
				});
			}
		} catch (error) {
			console.error("Failed to fetch dashboard data:", error);
			toast({
				title: "Error",
				description: "Failed to load dashboard data",
				variant: "destructive",
			});
		} finally {
			setIsLoadingData(false);
		}
	};

	// Fetch interviews data
	const fetchInterviews = async () => {
		try {
			setIsLoadingInterviews(true);
			const response = await fetch("/api/interviews");
			const result = await response.json();

			if (result.success) {
				setInterviewsData(result.data);
			} else {
				toast({
					title: "Error",
					description: "Failed to load interviews",
					variant: "destructive",
				});
			}
		} catch (error) {
			console.error("Failed to fetch interviews:", error);
			toast({
				title: "Error",
				description: "Failed to load interviews",
				variant: "destructive",
			});
		} finally {
			setIsLoadingInterviews(false);
		}
	};

	// Fetch cold mails data
	const fetchColdMails = async () => {
		try {
			setIsLoadingColdMails(true);
			const response = await fetch("/api/cold-mails");
			const result = await response.json();

			if (result.success) {
				setColdMailsData(result.data);
			} else {
				toast({
					title: "Error",
					description: "Failed to load cold mails",
					variant: "destructive",
				});
			}
		} catch (error) {
			console.error("Failed to fetch cold mails:", error);
			toast({
				title: "Error",
				description: "Failed to load cold mails",
				variant: "destructive",
			});
		} finally {
			setIsLoadingColdMails(false);
		}
	};

	// Handle interviews modal
	const handleShowInterviews = () => {
		setShowInterviewsModal(true);
		fetchInterviews();
	};

	// Handle cold mails modal
	const handleShowColdMails = () => {
		setShowColdMailsModal(true);
		fetchColdMails();
	};

	// Copy to clipboard helper
	const copyToClipboard = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			toast({
				title: "Copied!",
				description: "Content copied to clipboard",
			});
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to copy to clipboard",
				variant: "destructive",
			});
		}
	};

	// Handle resume deletion
	const handleDeleteResume = async (resumeId: string) => {
		try {
			const response = await fetch(`/api/resumes?id=${resumeId}`, {
				method: "DELETE",
			});

			const result = await response.json();

			if (result.success) {
				toast({
					title: "Success",
					description: "Resume deleted successfully",
				});
				fetchDashboardData(); // Refresh data
			} else {
				throw new Error(result.message);
			}
		} catch (error) {
			toast({
				title: "Error",
				description:
					error instanceof Error ? error.message : "Failed to delete resume",
				variant: "destructive",
			});
		}
	};

	// Handle interview deletion
	const handleDeleteInterview = async (interviewId: string) => {
		try {
			const response = await fetch(`/api/interviews?id=${interviewId}`, {
				method: "DELETE",
			});

			const result = await response.json();

			if (result.success) {
				toast({
					title: "Success",
					description: "Interview session deleted successfully",
				});
				fetchDashboardData(); // Refresh dashboard stats
				fetchInterviews(); // Refresh interviews list
			} else {
				throw new Error(result.message);
			}
		} catch (error) {
			toast({
				title: "Error",
				description:
					error instanceof Error ? error.message : "Failed to delete interview",
				variant: "destructive",
			});
		}
	};

	// Handle cold mail deletion
	const handleDeleteColdMail = async (coldMailId: string) => {
		try {
			const response = await fetch(`/api/cold-mails?id=${coldMailId}`, {
				method: "DELETE",
			});

			const result = await response.json();

			if (result.success) {
				toast({
					title: "Success",
					description: "Cold mail session deleted successfully",
				});
				fetchDashboardData(); // Refresh dashboard stats
				fetchColdMails(); // Refresh cold mails list
			} else {
				throw new Error(result.message);
			}
		} catch (error) {
			toast({
				title: "Error",
				description:
					error instanceof Error ? error.message : "Failed to delete cold mail",
				variant: "destructive",
			});
		}
	};

	// Handle resume rename
	const handleRenameResume = async (resumeId: string, newName: string) => {
		try {
			const response = await fetch(`/api/resumes?id=${resumeId}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ customName: newName }),
			});

			const result = await response.json();

			if (result.success) {
				toast({
					title: "Success",
					description: "Resume renamed successfully",
				});
				setEditingResume(null);
				setNewResumeName("");
				fetchDashboardData(); // Refresh data
			} else {
				throw new Error(result.message);
			}
		} catch (error) {
			toast({
				title: "Error",
				description:
					error instanceof Error ? error.message : "Failed to rename resume",
				variant: "destructive",
			});
		}
	};

	// Get activity icon
	const getActivityIcon = (type: string) => {
		switch (type) {
			case "resume":
				return <FileText className="h-4 w-4 text-[#76ABAE]" />;
			case "cold_mail":
				return <Mail className="h-4 w-4 text-blue-400" />;
			case "interview":
				return <Users className="h-4 w-4 text-green-400" />;
			default:
				return <Star className="h-4 w-4 text-gray-400" />;
		}
	};

	// Get current time
	useEffect(() => {
		const updateTime = () => {
			const now = new Date();
			const timeString = now.toLocaleTimeString([], {
				hour: "2-digit",
				minute: "2-digit",
			});
			setCurrentTime(timeString);
		};

		updateTime();
		const interval = setInterval(updateTime, 1000);
		return () => clearInterval(interval);
	}, []);

	// Get greeting based on time
	const getGreeting = () => {
		const hour = new Date().getHours();
		if (hour < 12) return "Good morning";
		if (hour < 17) return "Good afternoon";
		return "Good evening";
	};

	// Redirect if not authenticated
	useEffect(() => {
		if (status === "unauthenticated") {
			router.push("/auth");
		}
	}, [status, router]);

	// Simulate page load and fetch data
	useEffect(() => {
		const timer = setTimeout(() => setIsPageLoading(false), 100);

		// Fetch dashboard data when component mounts
		if (status === "authenticated") {
			fetchDashboardData();
		}

		return () => clearTimeout(timer);
	}, [status]);

	if (status === "loading") {
		return <LoaderOverlay variant="dots" size="xl" text="Loading session..." />;
	}

	if (!session) {
		return (
			<LoaderOverlay variant="dots" size="xl" text="Redirecting to login..." />
		);
	}

	return (
		<>
			<AnimatePresence>
				{isPageLoading && (
					<motion.div
						initial={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 bg-gradient-to-br from-[#222831] via-[#31363F] to-[#222831] flex items-center justify-center z-50"
					>
						<Loader variant="dots" size="xl" text="Loading your dashboard..." />
					</motion.div>
				)}
			</AnimatePresence>

			{!isPageLoading && (
				<div className="min-h-screen bg-gradient-to-br from-[#222831] via-[#31363F] to-[#222831] relative overflow-hidden">
					{/* Animated background elements */}
					<div className="absolute inset-0 overflow-hidden">
						<div className="absolute -top-10 -left-10 w-72 h-72 bg-[#76ABAE]/10 rounded-full blur-3xl animate-pulse"></div>
						<div className="absolute top-1/2 -right-20 w-96 h-96 bg-[#31363F]/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
						<div className="absolute -bottom-20 left-1/3 w-80 h-80 bg-[#76ABAE]/15 rounded-full blur-3xl animate-pulse delay-2000"></div>
					</div>

					{/* Back Button */}
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.5 }}
						className="absolute top-6 left-6 z-10"
					>
						<Link href="/">
							<Button
								variant="ghost"
								className="text-white hover:text-[#76ABAE] hover:bg-white/10 backdrop-blur-sm border border-white/20"
							>
								<ArrowLeft className="mr-2 h-4 w-4" />
								Back to Home
							</Button>
						</Link>
					</motion.div>

					<div className="container mx-auto px-6 py-8 relative z-10">
						{/* Add top spacing */}
						<div className="pt-20"></div>

						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.8 }}
						>
							{/* Enhanced Header */}
							<div className="mb-12 text-center">
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.6 }}
									className="mb-4"
								>
									<Badge
										variant="secondary"
										className="bg-[#76ABAE]/30 text-[#76ABAE] border-[#76ABAE]/40 mb-4"
									>
										<Clock className="w-3 h-3 mr-1" />
										{currentTime}
									</Badge>
								</motion.div>

								<motion.h1
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.6, delay: 0.1 }}
									className="text-5xl font-bold text-white mb-3 bg-gradient-to-r from-white to-[#76ABAE] bg-clip-text text-transparent"
								>
									{getGreeting()},{" "}
									{dashboardData?.user?.name || session?.user?.name || "User"}!
								</motion.h1>

								<motion.p
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.6, delay: 0.2 }}
									className="text-slate-300 text-xl max-w-2xl mx-auto"
								>
									Your AI-powered career companion is ready to help you succeed
								</motion.p>
							</div>

							{/* Quick Action Buttons - Enhanced */}
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6, delay: 0.3 }}
								className="flex flex-wrap justify-center gap-4 mb-12"
							>
								<Link href="/dashboard/cold-mail">
									<Button className="bg-gradient-to-r from-[#76ABAE] to-[#5A8B8F] hover:from-[#5A8B8F] hover:to-[#76ABAE] text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 button-hover">
										<Mail className="h-5 w-5 mr-2" />
										Cold Mail Generator
										<Zap className="h-4 w-4 ml-2" />
									</Button>
								</Link>
								<Link href="/dashboard/hiring-assistant">
									<Button className="bg-gradient-to-r from-[#31363F] to-[#4C566A] hover:from-[#4C566A] hover:to-[#31363F] text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 button-hover border border-slate-600/50">
										<Users className="h-5 w-5 mr-2" />
										Hiring Assistant
										<Target className="h-4 w-4 ml-2" />
									</Button>
								</Link>
							</motion.div>

							{/* Enhanced Quick Stats */}
							<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.5, delay: 0.1 }}
								>
									<Card
										className="backdrop-blur-sm bg-gradient-to-br from-[#31363F]/90 to-[#222831]/90 border-slate-600/30 shadow-2xl hover:shadow-3xl transition-all duration-300 card-hover group cursor-pointer"
										onClick={() => setShowResumesModal(true)}
									>
										<CardContent className="p-6">
											<div className="flex items-center justify-between mb-4">
												<div className="p-3 bg-[#76ABAE]/30 rounded-xl group-hover:bg-[#76ABAE]/40 transition-colors">
													<FileText className="h-6 w-6 text-[#76ABAE]" />
												</div>
												<Badge
													variant="secondary"
													className="bg-green-500/30 text-green-300 border-green-500/40"
												>
													<Eye className="w-3 h-3 mr-1" />
													View
												</Badge>
											</div>
											<div>
												<p className="text-slate-300 text-sm font-medium mb-1">
													Total Resumes
												</p>
												<p className="text-3xl font-bold text-white mb-2">
													{isLoadingData
														? "..."
														: dashboardData?.stats.totalResumes || 0}
												</p>
												<Progress
													value={Math.min(
														(dashboardData?.stats.totalResumes || 0) * 10,
														100
													)}
													className="h-2 bg-slate-600/50"
												/>
											</div>
										</CardContent>
									</Card>
								</motion.div>

								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.5, delay: 0.2 }}
								>
									<Card
										className="backdrop-blur-sm bg-gradient-to-br from-[#31363F]/90 to-[#222831]/90 border-slate-600/30 shadow-2xl hover:shadow-3xl transition-all duration-300 card-hover group cursor-pointer"
										onClick={handleShowColdMails}
									>
										<CardContent className="p-6">
											<div className="flex items-center justify-between mb-4">
												<div className="p-3 bg-blue-500/30 rounded-xl group-hover:bg-blue-500/40 transition-colors">
													<Mail className="h-6 w-6 text-blue-400" />
												</div>
												<Badge
													variant="secondary"
													className="bg-blue-500/30 text-blue-300 border-blue-500/40"
												>
													<Target className="w-3 h-3 mr-1" />
													Generated
												</Badge>
											</div>
											<div>
												<p className="text-slate-300 text-sm font-medium mb-1">
													Cold Emails
												</p>
												<p className="text-3xl font-bold text-white mb-2">
													{isLoadingData
														? "..."
														: dashboardData?.stats.totalColdMails || 0}
												</p>
												<Progress
													value={Math.min(
														(dashboardData?.stats.totalColdMails || 0) * 5,
														100
													)}
													className="h-2 bg-slate-600/50"
												/>
											</div>
										</CardContent>
									</Card>
								</motion.div>

								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.5, delay: 0.3 }}
								>
									<Card
										className="backdrop-blur-sm bg-gradient-to-br from-[#31363F]/90 to-[#222831]/90 border-slate-600/30 shadow-2xl hover:shadow-3xl transition-all duration-300 card-hover group cursor-pointer"
										onClick={handleShowInterviews}
									>
										<CardContent className="p-6">
											<div className="flex items-center justify-between mb-4">
												<div className="p-3 bg-green-500/30 rounded-xl group-hover:bg-green-500/40 transition-colors">
													<Users className="h-6 w-6 text-green-400" />
												</div>
												<Badge
													variant="secondary"
													className="bg-green-500/30 text-green-300 border-green-500/40"
												>
													<Target className="w-3 h-3 mr-1" />
													Practiced
												</Badge>
											</div>
											<div>
												<p className="text-slate-300 text-sm font-medium mb-1">
													Interview Sessions
												</p>
												<p className="text-3xl font-bold text-white mb-2">
													{isLoadingData
														? "..."
														: dashboardData?.stats.totalInterviews || 0}
												</p>
												<Progress
													value={Math.min(
														(dashboardData?.stats.totalInterviews || 0) * 10,
														100
													)}
													className="h-2 bg-slate-600/50"
												/>
											</div>
										</CardContent>
									</Card>
								</motion.div>
							</div>

							{/* Your Resumes Section */}
							{dashboardData &&
								dashboardData.resumes &&
								dashboardData.resumes.length > 0 && (
									<motion.div
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.5, delay: 0.4 }}
										className="mb-12"
									>
										<div className="flex items-center justify-between mb-6">
											<h2 className="text-2xl font-bold text-white flex items-center gap-3">
												<FileText className="h-6 w-6 text-[#76ABAE]" />
												Your Resumes
											</h2>
											<Link href="/dashboard/seeker">
												<Button
													variant="outline"
													className="border-[#76ABAE]/30 text-[#76ABAE] hover:text-slate-300 hover:bg-[#76ABAE]/10"
												>
													<PlusCircle className="h-4 w-4 mr-2" />
													Upload New
												</Button>
											</Link>
										</div>

										<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
											{dashboardData.resumes.slice(0, 6).map((resume) => (
												<Card
													key={resume.id}
													className="backdrop-blur-sm bg-gradient-to-br from-[#31363F]/95 to-[#222831]/95 border-slate-600/30 shadow-lg hover:shadow-xl transition-all duration-300 group"
												>
													<CardHeader className="pb-3">
														<CardTitle className="text-white flex items-center justify-between">
															<div className="flex items-center">
																<FileText className="mr-2 h-5 w-5 text-[#76ABAE]" />
																<span className="truncate text-sm">
																	{resume.customName}
																</span>
															</div>
														</CardTitle>
													</CardHeader>
													<CardContent className="space-y-3">
														<div className="space-y-2">
															<div className="flex items-center text-xs text-slate-400">
																<Calendar className="mr-2 h-3 w-3" />
																{new Date(resume.uploadDate).toLocaleDateString(
																	"en-US",
																	{
																		month: "short",
																		day: "numeric",
																		year: "numeric",
																	}
																)}
															</div>
															{resume.predictedField && (
																<div className="text-xs">
																	<Badge className="bg-[#76ABAE]/20 text-[#76ABAE] text-xs">
																		{resume.predictedField}
																	</Badge>
																</div>
															)}
															{resume.candidateName && (
																<div className="text-xs text-slate-300">
																	{resume.candidateName}
																</div>
															)}
														</div>

														<Link
															href={`/dashboard/analysis/${resume.id}`}
															className="block"
														>
															<Button
																size="sm"
																className="w-full bg-[#76ABAE] hover:bg-[#76ABAE]/80 text-white text-xs"
															>
																<Eye className="mr-2 h-3 w-3" />
																View Analysis
															</Button>
														</Link>
													</CardContent>
												</Card>
											))}
										</div>

										{dashboardData.resumes.length > 6 && (
											<div className="text-center mt-6">
												<Button
													onClick={() => setShowResumesModal(true)}
													variant="outline"
													className="border-[#76ABAE]/30 text-[#76ABAE] hover:bg-[#76ABAE]/10"
												>
													View All Resumes ({dashboardData.resumes.length})
												</Button>
											</div>
										)}
									</motion.div>
								)}

							{/* Enhanced Feature Cards */}
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
								<motion.div
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ duration: 0.5, delay: 0.5 }}
								>
									<Card className="backdrop-blur-sm bg-gradient-to-br from-[#31363F]/95 to-[#222831]/95 border-slate-600/30 shadow-2xl hover:shadow-3xl transition-all duration-300 card-hover group h-full">
										<CardHeader className="pb-4">
											<div className="flex items-center justify-between mb-2">
												<CardTitle className="text-white flex items-center gap-3 text-xl">
													<div className="p-2 bg-[#76ABAE]/30 rounded-lg group-hover:bg-[#76ABAE]/40 transition-colors">
														<FileText className="h-6 w-6 text-[#76ABAE]" />
													</div>
													Resume Analysis
												</CardTitle>
												<Badge className="bg-[#76ABAE]/30 text-[#76ABAE] border-[#76ABAE]/40">
													AI-Powered
												</Badge>
											</div>
											<CardDescription className="text-slate-300 text-base">
												Upload and analyze your resume to get AI-powered
												insights, suggestions, and optimization tips
											</CardDescription>
										</CardHeader>
										<CardContent className="pt-0">
											<div className="mb-6 space-y-2">
												<div className="flex items-center text-sm text-slate-300">
													<CheckCircle className="h-4 w-4 mr-2 text-green-400" />
													ATS Compatibility Check
												</div>
												<div className="flex items-center text-sm text-slate-300">
													<CheckCircle className="h-4 w-4 mr-2 text-green-400" />
													Skill Gap Analysis
												</div>
												<div className="flex items-center text-sm text-slate-300">
													<CheckCircle className="h-4 w-4 mr-2 text-green-400" />
													Industry-Specific Recommendations
												</div>
											</div>
											<Link href="/dashboard/seeker">
												<Button className="w-full bg-gradient-to-r from-[#76ABAE] to-[#5A8B8F] hover:from-[#5A8B8F] hover:to-[#76ABAE] group text-lg py-3 shadow-lg hover:shadow-xl transition-all duration-300 button-hover">
													<PlusCircle className="mr-2 h-5 w-5" />
													Get Started
													<ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
												</Button>
											</Link>
										</CardContent>
									</Card>
								</motion.div>

								<motion.div
									initial={{ opacity: 0, x: 20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ duration: 0.5, delay: 0.6 }}
								>
									<Card className="backdrop-blur-sm bg-gradient-to-br from-[#31363F]/95 to-[#222831]/95 border-slate-600/30 shadow-2xl hover:shadow-3xl transition-all duration-300 card-hover group h-full">
										<CardHeader className="pb-4">
											<div className="flex items-center justify-between mb-2">
												<CardTitle className="text-white flex items-center gap-3 text-xl">
													<div className="p-2 bg-slate-500/30 rounded-lg group-hover:bg-slate-500/40 transition-colors">
														<Users className="h-6 w-6 text-slate-300" />
													</div>
													For Recruiters
												</CardTitle>
												<Badge className="bg-slate-500/30 text-slate-300 border-slate-500/40">
													Pro Tools
												</Badge>
											</div>
											<CardDescription className="text-slate-300 text-base">
												Find and analyze candidate profiles with AI assistance
												and advanced filtering options
											</CardDescription>
										</CardHeader>
										<CardContent className="pt-0">
											<div className="mb-6 space-y-2">
												<div className="flex items-center text-sm text-slate-300">
													<CheckCircle className="h-4 w-4 mr-2 text-green-400" />
													Smart Candidate Matching
												</div>
												<div className="flex items-center text-sm text-slate-300">
													<CheckCircle className="h-4 w-4 mr-2 text-green-400" />
													Bulk Resume Processing
												</div>
												<div className="flex items-center text-sm text-slate-300">
													<CheckCircle className="h-4 w-4 mr-2 text-green-400" />
													Interview Question Generator
												</div>
											</div>
											<Link href="/dashboard/recruiter">
												<Button
													variant="outline"
													className="w-full border-slate-500/30 text-slate-900 hover:bg-slate-500/10 hover:text-white group text-lg py-3 shadow-lg hover:shadow-xl transition-all duration-300 button-hover"
												>
													<BarChart3 className="mr-2 h-5 w-5" />
													Explore Tools
													<ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
												</Button>
											</Link>
										</CardContent>
									</Card>
								</motion.div>
							</div>

							{/* Quick Tips Section */}
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: 0.7 }}
								className="mb-12"
							>
								<Card className="backdrop-blur-sm bg-gradient-to-br from-[#31363F]/95 to-[#222831]/95 border-slate-600/30 shadow-2xl">
									<CardHeader>
										<CardTitle className="text-white flex items-center gap-2">
											<Zap className="h-5 w-5 text-[#76ABAE]" />
											Quick Tips for Today
										</CardTitle>
										<CardDescription className="text-slate-300">
											Personalized recommendations to boost your career
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
											<div className="p-4 rounded-lg bg-gradient-to-br from-[#76ABAE]/20 to-[#76ABAE]/10 border border-[#76ABAE]/30">
												<div className="flex items-center mb-2">
													<Target className="h-4 w-4 text-[#76ABAE] mr-2" />
													<span className="text-sm font-medium text-white">
														Optimize Keywords
													</span>
												</div>
												<p className="text-xs text-slate-300">
													Add industry-specific keywords to improve ATS
													compatibility
												</p>
											</div>
											<div className="p-4 rounded-lg bg-gradient-to-br from-slate-500/20 to-slate-500/10 border border-slate-500/30">
												<div className="flex items-center mb-2">
													<Calendar className="h-4 w-4 text-slate-300 mr-2" />
													<span className="text-sm font-medium text-white">
														Update Profile
													</span>
												</div>
												<p className="text-xs text-slate-300">
													Keep your profile fresh with recent achievements
												</p>
											</div>
											<div className="p-4 rounded-lg bg-gradient-to-br from-[#76ABAE]/20 to-[#76ABAE]/10 border border-[#76ABAE]/30">
												<div className="flex items-center mb-2">
													<MessageSquare className="h-4 w-4 text-[#76ABAE] mr-2" />
													<span className="text-sm font-medium text-white">
														Network Smart
													</span>
												</div>
												<p className="text-xs text-slate-300">
													Use AI-generated cold emails to expand your network
												</p>
											</div>
										</div>
									</CardContent>
								</Card>
							</motion.div>

							{/* Recent Activity - Enhanced */}
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: 0.8 }}
							>
								<Card className="backdrop-blur-sm bg-gradient-to-br from-[#31363F]/95 to-[#222831]/95 border-slate-600/30 shadow-2xl">
									<CardHeader>
										<div className="flex items-center justify-between">
											<div>
												<CardTitle className="text-white flex items-center gap-2">
													<BarChart3 className="h-5 w-5 text-[#76ABAE]" />
													Activity Center
												</CardTitle>
												<CardDescription className="text-slate-300">
													Your latest actions and achievements
												</CardDescription>
											</div>
											<Badge className="bg-[#76ABAE]/30 text-[#76ABAE] border-[#76ABAE]/40">
												Live
											</Badge>
										</div>
									</CardHeader>
									<CardContent>
										{isLoadingData ? (
											<div className="flex items-center justify-center py-12">
												<Loader
													variant="spinner"
													size="lg"
													className="text-[#76ABAE]"
												/>
											</div>
										) : dashboardData?.recentActivity &&
										  dashboardData.recentActivity.length > 0 ? (
											<div className="space-y-4">
												{dashboardData.recentActivity.map((activity, index) => (
													<motion.div
														key={activity.id}
														initial={{ opacity: 0, x: -20 }}
														animate={{ opacity: 1, x: 0 }}
														transition={{ duration: 0.3, delay: index * 0.1 }}
														className="flex items-center space-x-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
													>
														<div className="flex-shrink-0">
															{getActivityIcon(activity.type)}
														</div>
														<div className="flex-1 min-w-0">
															<p className="text-white font-medium text-sm">
																{activity.title}
															</p>
															<p className="text-slate-400 text-xs truncate">
																{activity.description}
															</p>
														</div>
														<div className="flex-shrink-0">
															<p className="text-slate-500 text-xs">
																{new Date(activity.date).toLocaleDateString()}
															</p>
														</div>
													</motion.div>
												))}
											</div>
										) : (
											<div className="flex items-center justify-center py-12">
												<div className="text-center max-w-md">
													<div className="relative mb-6">
														<div className="absolute inset-0 flex items-center justify-center">
															<div className="w-24 h-24 bg-gradient-to-r from-[#76ABAE]/30 to-[#76ABAE]/20 rounded-full animate-pulse"></div>
														</div>
														<MessageSquare className="relative h-12 w-12 text-[#76ABAE] mx-auto" />
													</div>
													<h3 className="text-xl font-semibold text-white mb-2">
														Ready to Get Started?
													</h3>
													<p className="text-slate-300 mb-6">
														Begin your journey by uploading a resume or
														exploring our AI-powered features
													</p>
													<div className="flex flex-col sm:flex-row gap-3 justify-center">
														<Link href="/dashboard/seeker">
															<Button className="bg-gradient-to-r from-[#76ABAE] to-[#5A8B8F] hover:from-[#5A8B8F] hover:to-[#76ABAE] text-white px-6 py-2">
																<FileText className="mr-2 h-4 w-4" />
																Upload Resume
															</Button>
														</Link>
														<Link href="/dashboard/cold-mail">
															<Button
																variant="outline"
																className="border-[#76ABAE]/50 text-[#76ABAE] hover:bg-[#76ABAE]/10 hover:text-white px-6 py-2"
															>
																<Mail className="mr-2 h-4 w-4" />
																Try Cold Mail
															</Button>
														</Link>
													</div>
												</div>
											</div>
										)}
									</CardContent>
								</Card>
							</motion.div>
						</motion.div>
					</div>
				</div>
			)}

			{/* Resumes Management Modal */}
			<AnimatePresence>
				{showResumesModal && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
						onClick={() => setShowResumesModal(false)}
					>
						<motion.div
							initial={{ scale: 0.95, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.95, opacity: 0 }}
							className="backdrop-blur-lg bg-[#222831]/95 border border-white/10 text-[#EEEEEE] max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg relative"
							onClick={(e) => e.stopPropagation()}
						>
							{/* Close Button */}
							<button
								className="absolute right-4 top-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
								onClick={() => setShowResumesModal(false)}
							>
								<X className="h-4 w-4 text-[#EEEEEE]" />
							</button>

							<div className="p-6">
								{/* Header Section */}
								<div className="mb-6">
									<h2 className="text-2xl font-bold text-[#EEEEEE] mb-2 flex items-center">
										<FileText className="mr-3 h-6 w-6 text-[#76ABAE]" />
										Your Resumes ({dashboardData?.resumes.length || 0})
									</h2>
									<p className="text-[#EEEEEE]/60">
										Manage your uploaded resumes - rename or delete them as
										needed.
									</p>
								</div>

								{/* Content */}
								<div className="backdrop-blur-lg bg-white/5 rounded-lg p-6 border border-white/10">
									{isLoadingData ? (
										<div className="flex items-center justify-center py-12">
											<Loader
												variant="spinner"
												size="lg"
												className="text-[#76ABAE]"
											/>
										</div>
									) : dashboardData?.resumes &&
									  dashboardData.resumes.length > 0 ? (
										<div className="space-y-4">
											{dashboardData.resumes.map((resume, index) => (
												<motion.div
													key={resume.id}
													initial={{ opacity: 0, y: 20 }}
													animate={{ opacity: 1, y: 0 }}
													transition={{ duration: 0.3, delay: index * 0.1 }}
													className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
												>
													<div className="flex-1 min-w-0">
														{editingResume?.id === resume.id ? (
															<div className="flex items-center space-x-2">
																<Input
																	value={newResumeName}
																	onChange={(e) =>
																		setNewResumeName(e.target.value)
																	}
																	className="bg-white/10 border-white/20 text-[#EEEEEE] placeholder:text-[#EEEEEE]/40"
																	placeholder="Enter new name"
																/>
																<Button
																	size="sm"
																	onClick={() =>
																		handleRenameResume(resume.id, newResumeName)
																	}
																	className="bg-[#76ABAE] hover:bg-[#76ABAE]/80 text-white"
																>
																	Save
																</Button>
																<Button
																	size="sm"
																	variant="outline"
																	onClick={() => {
																		setEditingResume(null);
																		setNewResumeName("");
																	}}
																	className="border-white/20 text-gray-900 hover:text-[#EEEEEE] hover:bg-white/10"
																>
																	Cancel
																</Button>
															</div>
														) : (
															<div>
																<h3 className="font-semibold text-[#EEEEEE] truncate">
																	{resume.customName}
																</h3>
																<div className="flex items-center space-x-4 mt-1">
																	{resume.candidateName && (
																		<span className="text-xs text-[#EEEEEE]/60">
																			{resume.candidateName}
																		</span>
																	)}
																	{resume.predictedField && (
																		<Badge className="bg-[#76ABAE]/10 text-[#76ABAE] border border-[#76ABAE]/30 text-xs">
																			{resume.predictedField}
																		</Badge>
																	)}
																	<span className="text-xs text-[#EEEEEE]/40">
																		{new Date(
																			resume.uploadDate
																		).toLocaleDateString()}
																	</span>
																</div>
															</div>
														)}
													</div>

													{editingResume?.id !== resume.id && (
														<div className="flex items-center space-x-2 ml-4">
															<Button
																size="sm"
																variant="ghost"
																onClick={() => {
																	setEditingResume({
																		id: resume.id,
																		name: resume.customName,
																	});
																	setNewResumeName(resume.customName);
																}}
																className="text-[#76ABAE] hover:text-[#EEEEEE] hover:bg-white/10"
															>
																<Edit className="h-4 w-4" />
															</Button>
															<Button
																size="sm"
																variant="ghost"
																onClick={() =>
																	setDeletingResume({
																		id: resume.id,
																		name: resume.customName,
																	})
																}
																className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
															>
																<Trash2 className="h-4 w-4" />
															</Button>
														</div>
													)}
												</motion.div>
											))}
										</div>
									) : (
										<div className="text-center py-12">
											<FileText className="h-16 w-16 text-[#76ABAE]/50 mx-auto mb-4" />
											<h3 className="text-lg font-semibold text-[#EEEEEE] mb-2">
												No resumes uploaded yet
											</h3>
											<p className="text-[#EEEEEE]/60 mb-6">
												Upload your first resume to get started with AI-powered
												analysis
											</p>
											<Link href="/dashboard/seeker">
												<Button className="bg-gradient-to-r from-[#76ABAE] to-[#5A8B8F] hover:from-[#5A8B8F] hover:to-[#76ABAE] text-white">
													<FileText className="mr-2 h-4 w-4" />
													Upload Resume
												</Button>
											</Link>
										</div>
									)}
								</div>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Delete Confirmation Dialog */}
			<AnimatePresence>
				{deletingResume && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
						onClick={() => setDeletingResume(null)}
					>
						<motion.div
							initial={{ scale: 0.95, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.95, opacity: 0 }}
							className="backdrop-blur-lg bg-[#222831]/95 border border-white/10 text-[#EEEEEE] max-w-md rounded-lg relative"
							onClick={(e) => e.stopPropagation()}
						>
							{/* Close Button */}
							<button
								className="absolute right-4 top-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
								onClick={() => setDeletingResume(null)}
							>
								<X className="h-4 w-4 text-[#EEEEEE]" />
							</button>

							<div className="p-6">
								{/* Header Section */}
								<div className="mb-6">
									<h2 className="text-2xl font-bold text-[#EEEEEE] mb-2 flex items-center">
										<Trash2 className="mr-3 h-6 w-6 text-red-400" />
										Delete Resume
									</h2>
									<p className="text-[#EEEEEE]/60">
										Are you sure you want to delete "{deletingResume?.name}"?
										This action cannot be undone.
									</p>
								</div>

								{/* Action Buttons */}
								<div className="flex gap-3 justify-end">
									<Button
										variant="outline"
										onClick={() => setDeletingResume(null)}
										className="border-white/20 text-gray-900 hover:text-[#EEEEEE] hover:bg-white/10"
									>
										Cancel
									</Button>
									<Button
										onClick={() => {
											if (deletingResume) {
												handleDeleteResume(deletingResume.id);
												setDeletingResume(null);
											}
										}}
										className="bg-red-600 hover:bg-red-700 text-white"
									>
										Delete
									</Button>
								</div>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Interviews Modal */}
			<AnimatePresence>
				{showInterviewsModal && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
						onClick={() => setShowInterviewsModal(false)}
					>
						<motion.div
							initial={{ scale: 0.95, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.95, opacity: 0 }}
							className="backdrop-blur-lg bg-[#222831]/95 border border-white/10 text-[#EEEEEE] max-w-6xl max-h-[90vh] overflow-y-auto rounded-lg relative"
							onClick={(e) => e.stopPropagation()}
						>
							{/* Close Button */}
							<button
								className="absolute right-4 top-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
								onClick={() => setShowInterviewsModal(false)}
							>
								<X className="h-4 w-4 text-[#EEEEEE]" />
							</button>

							<div className="p-6">
								{/* Header Section */}
								<div className="mb-6">
									<h2 className="text-2xl font-bold text-[#EEEEEE] mb-2 flex items-center">
										<Users className="mr-3 h-6 w-6 text-[#76ABAE]" />
										Interview Sessions ({interviewsData.length})
									</h2>
									<p className="text-[#EEEEEE]/60">
										Your practice interview sessions with questions and answers
									</p>
								</div>

								{/* Content */}
								<div className="backdrop-blur-lg bg-white/5 rounded-lg p-6 border border-white/10">
									{isLoadingInterviews ? (
										<div className="flex items-center justify-center py-8">
											<Loader
												variant="dots"
												size="lg"
												text="Loading interviews..."
											/>
										</div>
									) : interviewsData.length === 0 ? (
										<div className="text-center py-8">
											<Users className="h-16 w-16 mx-auto mb-4 text-[#76ABAE]/50" />
											<h3 className="text-lg font-semibold text-[#EEEEEE] mb-2">
												No interview sessions found
											</h3>
											<p className="text-[#EEEEEE]/60">
												Start practicing to see your sessions here
											</p>
										</div>
									) : (
										<div className="space-y-6">
											{interviewsData.map((session: InterviewSession) => (
												<div
													key={session.id}
													className="backdrop-blur-lg bg-white/5 rounded-lg p-6 border border-white/10"
												>
													{/* Session Header */}
													<div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
														<div className="min-w-0 flex-1">
															<h3 className="text-lg font-semibold text-[#EEEEEE] mb-2 flex items-center">
																<Briefcase className="mr-2 h-5 w-5 text-[#76ABAE]" />
																{session.role} at {session.companyName}
															</h3>
															<p className="text-[#EEEEEE]/60 text-sm">
																{new Date(session.createdAt).toLocaleDateString(
																	"en-US",
																	{
																		year: "numeric",
																		month: "short",
																		day: "numeric",
																		hour: "2-digit",
																		minute: "2-digit",
																	}
																)}
															</p>
														</div>
														<div className="flex items-center gap-2 shrink-0">
															<Badge className="bg-[#76ABAE]/10 text-[#76ABAE] border border-[#76ABAE]/30 text-xs">
																{session.questionsAndAnswers.length} Questions
															</Badge>
															<Button
																size="sm"
																variant="ghost"
																className="h-8 w-8 p-0 hover:bg-red-500/20 text-red-400 hover:text-red-300"
																onClick={() =>
																	setDeletingInterview({
																		id: session.id,
																		role: session.role,
																		companyName: session.companyName,
																	})
																}
															>
																<Trash2 className="h-4 w-4" />
															</Button>
														</div>
													</div>

													{/* Questions and Answers */}
													<div className="space-y-4">
														{session.questionsAndAnswers.map((qa, index) => (
															<div
																key={index}
																className="border-l-2 border-[#76ABAE] pl-4"
															>
																<div className="mb-2">
																	<p className="font-semibold text-[#EEEEEE] mb-1 text-sm sm:text-base">
																		<span className="text-[#76ABAE] font-semibold">
																			Q{index + 1}:
																		</span>{" "}
																		{qa.question}
																	</p>
																</div>
																<div className="backdrop-blur-lg bg-white/5 rounded-lg p-4 border border-white/10 relative">
																	<p className="text-[#EEEEEE]/80 text-sm leading-relaxed pr-10">
																		{qa.answer}
																	</p>
																	<Button
																		size="sm"
																		variant="ghost"
																		className="absolute top-2 right-2 h-8 w-8 p-0 hover:bg-white/10"
																		onClick={() => copyToClipboard(qa.answer)}
																	>
																		<Copy className="h-4 w-4 text-[#76ABAE]" />
																	</Button>
																</div>
															</div>
														))}
													</div>
												</div>
											))}
										</div>
									)}
								</div>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Cold Mails Modal */}
			<AnimatePresence>
				{showColdMailsModal && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
						onClick={() => setShowColdMailsModal(false)}
					>
						<motion.div
							initial={{ scale: 0.95, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.95, opacity: 0 }}
							className="backdrop-blur-lg bg-[#222831]/95 border border-white/10 text-[#EEEEEE] max-w-6xl max-h-[90vh] overflow-y-auto rounded-lg relative"
							onClick={(e) => e.stopPropagation()}
						>
							{/* Close Button */}
							<button
								className="absolute right-4 top-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
								onClick={() => setShowColdMailsModal(false)}
							>
								<X className="h-4 w-4 text-[#EEEEEE]" />
							</button>

							<div className="p-6">
								{/* Header Section */}
								<div className="mb-6">
									<h2 className="text-2xl font-bold text-[#EEEEEE] mb-2 flex items-center">
										<Mail className="mr-3 h-6 w-6 text-[#76ABAE]" />
										Cold Emails ({coldMailsData.length})
									</h2>
									<p className="text-[#EEEEEE]/60">
										Your generated cold emails for networking and outreach
									</p>
								</div>

								{/* Content */}
								<div className="backdrop-blur-lg bg-white/5 rounded-lg p-6 border border-white/10">
									{isLoadingColdMails ? (
										<div className="flex items-center justify-center py-8">
											<Loader
												variant="dots"
												size="lg"
												text="Loading cold mails..."
											/>
										</div>
									) : coldMailsData.length === 0 ? (
										<div className="text-center py-8">
											<Mail className="h-16 w-16 mx-auto mb-4 text-[#76ABAE]/50" />
											<h3 className="text-lg font-semibold text-[#EEEEEE] mb-2">
												No cold emails found
											</h3>
											<p className="text-[#EEEEEE]/60">
												Generate your first cold email to see it here
											</p>
										</div>
									) : (
										<div className="space-y-6">
											{coldMailsData.map((session: ColdMailSession) => (
												<div
													key={session.id}
													className="backdrop-blur-lg bg-white/5 rounded-lg p-6 border border-white/10"
												>
													{/* Session Header */}
													<div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
														<div className="min-w-0 flex-1">
															<h3 className="text-lg font-semibold text-[#EEEEEE] mb-1 flex items-center">
																<User className="mr-2 h-5 w-5 text-[#76ABAE]" />
																To: {session.recipientName}
															</h3>
															<p className="text-[#EEEEEE]/80 text-sm mb-1">
																{session.recipientDesignation} at{" "}
																{session.companyName}
															</p>
															<p className="text-[#EEEEEE]/40 text-xs">
																{new Date(session.createdAt).toLocaleDateString(
																	"en-US",
																	{
																		year: "numeric",
																		month: "short",
																		day: "numeric",
																		hour: "2-digit",
																		minute: "2-digit",
																	}
																)}
															</p>
														</div>
														<div className="flex items-center gap-2 shrink-0">
															<Badge className="bg-[#76ABAE]/10 text-[#76ABAE] border border-[#76ABAE]/30 text-xs">
																{session.emails.length} Email
																{session.emails.length !== 1 ? "s" : ""}
															</Badge>
															<Button
																size="sm"
																variant="ghost"
																className="h-8 w-8 p-0 hover:bg-red-500/20 text-red-400 hover:text-red-300"
																onClick={() =>
																	setDeletingColdMail({
																		id: session.id,
																		recipientName: session.recipientName,
																		companyName: session.companyName,
																	})
																}
															>
																<Trash2 className="h-4 w-4" />
															</Button>
														</div>
													</div>

													{/* Emails */}
													<div className="space-y-4">
														{session.emails.map((email, index) => (
															<div
																key={email.id}
																className="border-l-2 border-[#76ABAE] pl-4"
															>
																<div className="mb-2">
																	<p className="font-semibold text-[#EEEEEE] mb-1 flex items-center gap-2 text-sm sm:text-base">
																		<Mail className="h-4 w-4 text-[#76ABAE]" />
																		<span className="text-[#76ABAE] font-semibold">
																			Subject:
																		</span>
																		<span className="truncate">
																			{email.subject}
																		</span>
																	</p>
																</div>
																<div className="backdrop-blur-lg bg-white/5 rounded-lg p-4 border border-white/10 relative">
																	<div className="text-[#EEEEEE]/80 text-sm leading-relaxed pr-10 whitespace-pre-wrap">
																		{email.body}
																	</div>
																	<Button
																		size="sm"
																		variant="ghost"
																		className="absolute top-2 right-2 h-8 w-8 p-0 hover:bg-white/10"
																		onClick={() =>
																			copyToClipboard(
																				`Subject: ${email.subject}\n\n${email.body}`
																			)
																		}
																	>
																		<Copy className="h-4 w-4 text-[#76ABAE]" />
																	</Button>
																</div>
															</div>
														))}
													</div>
												</div>
											))}
										</div>
									)}
								</div>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Delete Interview Confirmation Dialog */}
			<AnimatePresence>
				{deletingInterview && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
						onClick={() => setDeletingInterview(null)}
					>
						<motion.div
							initial={{ scale: 0.95, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.95, opacity: 0 }}
							className="backdrop-blur-lg bg-[#222831]/95 border border-white/10 text-[#EEEEEE] max-w-md rounded-lg relative"
							onClick={(e) => e.stopPropagation()}
						>
							{/* Close Button */}
							<button
								className="absolute right-4 top-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
								onClick={() => setDeletingInterview(null)}
							>
								<X className="h-4 w-4 text-[#EEEEEE]" />
							</button>

							<div className="p-6">
								{/* Header Section */}
								<div className="mb-6">
									<h2 className="text-2xl font-bold text-[#EEEEEE] mb-2 flex items-center">
										<Trash2 className="mr-3 h-6 w-6 text-red-400" />
										Delete Interview Session
									</h2>
									<p className="text-[#EEEEEE]/60">
										Are you sure you want to delete the interview session for "
										{deletingInterview?.role} at{" "}
										{deletingInterview?.companyName}"? This action cannot be
										undone and will remove all questions and answers.
									</p>
								</div>

								{/* Action Buttons */}
								<div className="flex gap-3 justify-end">
									<Button
										variant="outline"
										onClick={() => setDeletingInterview(null)}
										className="border-white/20 text-gray-900 hover:text-[#EEEEEE] hover:bg-white/10"
									>
										Cancel
									</Button>
									<Button
										onClick={() => {
											if (deletingInterview) {
												handleDeleteInterview(deletingInterview.id);
												setDeletingInterview(null);
											}
										}}
										className="bg-red-600 hover:bg-red-700 text-white"
									>
										Delete Session
									</Button>
								</div>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Delete Cold Mail Confirmation Dialog */}
			<AnimatePresence>
				{deletingColdMail && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
						onClick={() => setDeletingColdMail(null)}
					>
						<motion.div
							initial={{ scale: 0.95, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.95, opacity: 0 }}
							className="backdrop-blur-lg bg-[#222831]/95 border border-white/10 text-[#EEEEEE] max-w-md rounded-lg relative"
							onClick={(e) => e.stopPropagation()}
						>
							{/* Close Button */}
							<button
								className="absolute right-4 top-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
								onClick={() => setDeletingColdMail(null)}
							>
								<X className="h-4 w-4 text-[#EEEEEE]" />
							</button>

							<div className="p-6">
								{/* Header Section */}
								<div className="mb-6">
									<h2 className="text-2xl font-bold text-[#EEEEEE] mb-2 flex items-center">
										<Trash2 className="mr-3 h-6 w-6 text-red-400" />
										Delete Cold Mail Session
									</h2>
									<p className="text-[#EEEEEE]/60">
										Are you sure you want to delete the cold mail session for "
										{deletingColdMail?.recipientName} at{" "}
										{deletingColdMail?.companyName}"? This action cannot be
										undone and will remove all generated emails.
									</p>
								</div>

								{/* Action Buttons */}
								<div className="flex gap-3 justify-end">
									<Button
										variant="outline"
										onClick={() => setDeletingColdMail(null)}
										className="border-white/20 text-gray-900 hover:text-[#EEEEEE] hover:bg-white/10"
									>
										Cancel
									</Button>
									<Button
										onClick={() => {
											if (deletingColdMail) {
												handleDeleteColdMail(deletingColdMail.id);
												setDeletingColdMail(null);
											}
										}}
										className="bg-red-600 hover:bg-red-700 text-white"
									>
										Delete Session
									</Button>
								</div>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
}
