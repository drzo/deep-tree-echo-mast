import { motion } from "framer-motion";
import { Link } from "@remix-run/react";
import {
  FiMessageCircle,
  FiDatabase,
  FiMap,
  FiTerminal,
  FiCode,
  FiSettings,
  FiCpu,
  FiFeather,
} from "react-icons/fi";

interface Portal {
  id: string;
  name: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  gradient: string;
  glowColor: string;
  status?: "active" | "idle" | "processing";
}

const portals: Portal[] = [
  {
    id: "chat",
    name: "Dialogue Chamber",
    description: "Engage in reflective conversation",
    href: "/chat",
    icon: <FiMessageCircle size={24} />,
    gradient: "from-emerald-500 to-green-600",
    glowColor: "rgba(34, 197, 94, 0.4)",
    status: "active",
  },
  {
    id: "memory",
    name: "Memory Sanctum",
    description: "Explore accumulated wisdom",
    href: "/memory",
    icon: <FiDatabase size={24} />,
    gradient: "from-blue-500 to-cyan-600",
    glowColor: "rgba(59, 130, 246, 0.4)",
    status: "processing",
  },
  {
    id: "map",
    name: "Cognitive Atlas",
    description: "Navigate the architecture",
    href: "/map",
    icon: <FiMap size={24} />,
    gradient: "from-amber-500 to-orange-600",
    glowColor: "rgba(245, 158, 11, 0.4)",
    status: "idle",
  },
  {
    id: "terminal",
    name: "Command Nexus",
    description: "Direct system interface",
    href: "/terminal",
    icon: <FiTerminal size={24} />,
    gradient: "from-gray-500 to-slate-600",
    glowColor: "rgba(148, 163, 184, 0.4)",
    status: "idle",
  },
  {
    id: "editor",
    name: "Creation Studio",
    description: "Craft and modify patterns",
    href: "/editor",
    icon: <FiCode size={24} />,
    gradient: "from-teal-500 to-emerald-600",
    glowColor: "rgba(20, 184, 166, 0.4)",
    status: "idle",
  },
  {
    id: "settings",
    name: "Configuration Core",
    description: "Adjust system parameters",
    href: "/settings",
    icon: <FiSettings size={24} />,
    gradient: "from-slate-500 to-gray-600",
    glowColor: "rgba(100, 116, 139, 0.4)",
    status: "idle",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

export function NavigationPortals() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 md:grid-cols-3 gap-4"
    >
      {portals.map((portal) => (
        <PortalCard key={portal.id} portal={portal} />
      ))}
    </motion.div>
  );
}

function PortalCard({ portal }: { portal: Portal }) {
  return (
    <motion.div variants={itemVariants}>
      <Link to={portal.href}>
        <motion.div
          className="relative group"
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div
            className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${portal.glowColor}, transparent 70%)`,
              filter: "blur(20px)",
            }}
          />

          <div className="relative bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-5 overflow-hidden group-hover:border-gray-700 transition-colors duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
              <div
                className={`w-full h-full bg-gradient-to-br ${portal.gradient} rounded-full blur-2xl transform translate-x-8 -translate-y-8`}
              />
            </div>

            <div className="relative">
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`p-2.5 rounded-lg bg-gradient-to-br ${portal.gradient} text-white shadow-lg`}
                >
                  {portal.icon}
                </div>

                {portal.status && (
                  <div className="flex items-center gap-1.5">
                    <motion.div
                      className={`w-2 h-2 rounded-full ${
                        portal.status === "active"
                          ? "bg-green-400"
                          : portal.status === "processing"
                            ? "bg-blue-400"
                            : "bg-gray-500"
                      }`}
                      animate={
                        portal.status === "active" || portal.status === "processing"
                          ? { opacity: [1, 0.5, 1] }
                          : {}
                      }
                      transition={{
                        duration: portal.status === "processing" ? 0.8 : 2,
                        repeat: Infinity,
                      }}
                    />
                    <span className="text-xs text-gray-500 capitalize">
                      {portal.status}
                    </span>
                  </div>
                )}
              </div>

              <h3 className="text-white font-medium mb-1 group-hover:text-green-300 transition-colors duration-300">
                {portal.name}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                {portal.description}
              </p>

              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gray-700 to-transparent opacity-0 group-hover:opacity-100"
                initial={{ scaleX: 0 }}
                whileHover={{ scaleX: 1 }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

export function QuickActions() {
  const actions = [
    {
      icon: <FiCpu size={18} />,
      label: "System Status",
      color: "text-green-400",
    },
    {
      icon: <FiFeather size={18} />,
      label: "New Insight",
      color: "text-amber-400",
    },
  ];

  return (
    <div className="flex gap-3 justify-center">
      {actions.map((action) => (
        <motion.button
          key={action.label}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900/60 border border-gray-800 rounded-lg hover:border-gray-700 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className={action.color}>{action.icon}</span>
          <span className="text-gray-400 text-sm">{action.label}</span>
        </motion.button>
      ))}
    </div>
  );
}
