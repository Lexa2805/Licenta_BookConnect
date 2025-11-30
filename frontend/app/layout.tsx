import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "./providers";
import { ThemeProvider } from "./theme-provider";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
    title: "BookConnect",
    description: "Connect with books and readers",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                <ThemeProvider>
                    <AuthProvider>
                        <Navigation />
                        {children}
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}