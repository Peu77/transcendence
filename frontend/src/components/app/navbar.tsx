import {useState} from "react";
import {Button} from "@/components/ui/button.tsx";
import {MoonIcon, SunIcon} from "lucide-react";

export const Navbar = () => {
    const [isDark, setIsDark] = useState(() =>
        document.documentElement.classList.contains("dark"),
    );

    const toggleDarkMode = () => {
        document.documentElement.classList.toggle("dark");
        setIsDark(document.documentElement.classList.contains("dark"));
    };

    return (
        <nav className="w-full h-16 bg-card flex items-center px-4 shadow-sm">
            <div className="text-xl font-bold ">
                Transcendence
            </div>

            <Button variant="ghost" onClick={toggleDarkMode} className="ml-auto">
                {isDark ? <MoonIcon/> : <SunIcon/>}
            </Button>
        </nav>
    )
}