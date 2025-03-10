import React from "react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import logoImage from "@/stores/images/Logo.png";

export const Header: React.FC = () => {
  const navigate = useNavigate();

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="border-b py-4 px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 fixed top-0 w-full z-50"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-bold">
            <Link to="/a">
              <img
                src={logoImage}
                className="max-w-40 cursor-pointer"
                alt="로고"
              />
            </Link>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/download")}>
            앱 다운로드
          </Button>
          <Button
            onClick={() => navigate("/login")}
            className="bg-[#61C9A8] hover:bg-[#61C9A8] text-white hover:scale-105 transition-transform"
          >
            로그인
          </Button>
        </div>
      </div>
    </motion.nav>
  );
};
