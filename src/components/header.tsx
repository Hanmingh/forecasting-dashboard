import { Link } from "react-router-dom"

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#99b6c4]/20">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
            <Link to={"/"} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <img src={'./logo.png'} className="h-12 drop-shadow-md" alt="Fuelture Logo"/>
                <span className="bg-gradient-to-r from-[#61adde] to-[#4670bc] bg-clip-text text-transparent font-bold text-2xl tracking-wide">FUELTURE</span>
            </Link>
        </div>
    </header>
  )
}

export default Header