import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import HomeImage from "@/components/HomeImage/HomeImage";
import HomeText from "@/components/HomeText/HomeText";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-20 pb-16">
        <HomeImage />
        <HomeText />
      </main>
      <Footer />
    </div>
  );
}
