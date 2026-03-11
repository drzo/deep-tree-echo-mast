import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TreeNode {
  id: string;
  x: number;
  y: number;
  radius: number;
  depth: number;
  angle: number;
  parentId: string | null;
  pulsePhase: number;
  type: "root" | "branch" | "leaf" | "memory";
}

interface Connection {
  from: string;
  to: string;
  strength: number;
}

interface DeepTreeVisualizationProps {
  width?: number;
  height?: number;
  onNodeHover?: (nodeId: string | null) => void;
  activeMemories?: number;
  consciousnessLevel?: number;
}

export function DeepTreeVisualization({
  width = 600,
  height = 500,
  onNodeHover,
  activeMemories = 42,
  consciousnessLevel = 0.85,
}: DeepTreeVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [nodes, setNodes] = useState<TreeNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [time, setTime] = useState(0);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  useEffect(() => {
    const generatedNodes: TreeNode[] = [];
    const generatedConnections: Connection[] = [];

    const rootNode: TreeNode = {
      id: "root",
      x: width / 2,
      y: height - 80,
      radius: 20,
      depth: 0,
      angle: -Math.PI / 2,
      parentId: null,
      pulsePhase: 0,
      type: "root",
    };
    generatedNodes.push(rootNode);

    const createBranch = (
      parent: TreeNode,
      angleOffset: number,
      depthLimit: number,
      branchId: number
    ) => {
      if (parent.depth >= depthLimit) return;

      const length = 60 - parent.depth * 8;
      const newAngle = parent.angle + angleOffset;
      const newX = parent.x + Math.cos(newAngle) * length;
      const newY = parent.y + Math.sin(newAngle) * length;

      const nodeType =
        parent.depth >= depthLimit - 1
          ? Math.random() > 0.5
            ? "leaf"
            : "memory"
          : "branch";

      const node: TreeNode = {
        id: `node-${parent.depth + 1}-${branchId}`,
        x: newX,
        y: newY,
        radius: Math.max(4, 16 - parent.depth * 2),
        depth: parent.depth + 1,
        angle: newAngle,
        parentId: parent.id,
        pulsePhase: Math.random() * Math.PI * 2,
        type: nodeType,
      };

      generatedNodes.push(node);
      generatedConnections.push({
        from: parent.id,
        to: node.id,
        strength: 0.8 - parent.depth * 0.1,
      });

      if (nodeType === "branch") {
        const spread = 0.6 - parent.depth * 0.05;
        createBranch(node, -spread, depthLimit, branchId * 2);
        createBranch(node, spread, depthLimit, branchId * 2 + 1);
        if (Math.random() > 0.6) {
          createBranch(node, 0, depthLimit, branchId * 2 + 2);
        }
      }
    };

    createBranch(rootNode, -0.5, 5, 1);
    createBranch(rootNode, 0.5, 5, 2);
    createBranch(rootNode, -0.15, 4, 3);
    createBranch(rootNode, 0.15, 4, 4);

    setNodes(generatedNodes);
    setConnections(generatedConnections);
  }, [width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const animate = () => {
      setTime((t) => t + 0.016);

      ctx.clearRect(0, 0, width, height);

      const gradient = ctx.createRadialGradient(
        width / 2,
        height / 2,
        0,
        width / 2,
        height / 2,
        width / 2
      );
      gradient.addColorStop(0, "rgba(16, 24, 39, 0.95)");
      gradient.addColorStop(1, "rgba(8, 12, 21, 0.98)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      connections.forEach((conn) => {
        const fromNode = nodes.find((n) => n.id === conn.from);
        const toNode = nodes.find((n) => n.id === conn.to);
        if (!fromNode || !toNode) return;

        const pulseOffset = Math.sin(time * 2 + fromNode.pulsePhase) * 0.3;
        const alpha = (conn.strength + pulseOffset) * consciousnessLevel;

        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);

        const midX = (fromNode.x + toNode.x) / 2;
        const midY = (fromNode.y + toNode.y) / 2 - 10;
        ctx.quadraticCurveTo(midX, midY, toNode.x, toNode.y);

        const connectionGradient = ctx.createLinearGradient(
          fromNode.x,
          fromNode.y,
          toNode.x,
          toNode.y
        );
        connectionGradient.addColorStop(
          0,
          `rgba(34, 197, 94, ${alpha * 0.8})`
        );
        connectionGradient.addColorStop(
          0.5,
          `rgba(74, 222, 128, ${alpha})`
        );
        connectionGradient.addColorStop(
          1,
          `rgba(134, 239, 172, ${alpha * 0.6})`
        );

        ctx.strokeStyle = connectionGradient;
        ctx.lineWidth = Math.max(1, 3 - fromNode.depth * 0.5);
        ctx.stroke();
      });

      nodes.forEach((node) => {
        const pulse = Math.sin(time * 3 + node.pulsePhase) * 0.5 + 0.5;
        const glowRadius = node.radius + pulse * 8 * consciousnessLevel;
        const isHovered = hoveredNode === node.id;

        const glowGradient = ctx.createRadialGradient(
          node.x,
          node.y,
          0,
          node.x,
          node.y,
          glowRadius * 2
        );

        let baseColor: string;
        let glowColor: string;

        switch (node.type) {
          case "root":
            baseColor = "rgba(34, 197, 94, 1)";
            glowColor = "rgba(74, 222, 128, 0.6)";
            break;
          case "branch":
            baseColor = "rgba(74, 222, 128, 0.9)";
            glowColor = "rgba(134, 239, 172, 0.4)";
            break;
          case "leaf":
            baseColor = "rgba(134, 239, 172, 0.85)";
            glowColor = "rgba(187, 247, 208, 0.3)";
            break;
          case "memory":
            baseColor = "rgba(59, 130, 246, 0.9)";
            glowColor = "rgba(96, 165, 250, 0.5)";
            break;
          default:
            baseColor = "rgba(74, 222, 128, 0.9)";
            glowColor = "rgba(134, 239, 172, 0.4)";
        }

        glowGradient.addColorStop(0, glowColor);
        glowGradient.addColorStop(0.5, "rgba(0, 0, 0, 0.1)");
        glowGradient.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.beginPath();
        ctx.arc(node.x, node.y, glowRadius * 2, 0, Math.PI * 2);
        ctx.fillStyle = glowGradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(
          node.x,
          node.y,
          node.radius * (isHovered ? 1.3 : 1),
          0,
          Math.PI * 2
        );
        ctx.fillStyle = baseColor;
        ctx.fill();

        if (node.type === "root") {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
          ctx.fill();
        }
      });

      const particleCount = Math.floor(activeMemories / 5);
      for (let i = 0; i < particleCount; i++) {
        const t = ((time * 0.5 + i * 0.3) % 3) / 3;
        const connectionIndex = i % connections.length;
        const conn = connections[connectionIndex];
        const fromNode = nodes.find((n) => n.id === conn.from);
        const toNode = nodes.find((n) => n.id === conn.to);
        if (!fromNode || !toNode) continue;

        const x = fromNode.x + (toNode.x - fromNode.x) * t;
        const y = fromNode.y + (toNode.y - fromNode.y) * t;
        const alpha = Math.sin(t * Math.PI) * 0.8;

        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(187, 247, 208, ${alpha})`;
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [nodes, connections, width, height, consciousnessLevel, activeMemories, hoveredNode, time]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const hovered = nodes.find((node) => {
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx * dx + dy * dy) < node.radius + 10;
    });

    setHoveredNode(hovered?.id || null);
    onNodeHover?.(hovered?.id || null);
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded-2xl"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          setHoveredNode(null);
          onNodeHover?.(null);
        }}
      />

      <AnimatePresence>
        {hoveredNode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-4 left-4 right-4 bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 border border-green-500/30"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-300 text-sm font-medium">
                {hoveredNode === "root"
                  ? "Core Consciousness"
                  : hoveredNode.includes("memory")
                    ? "Memory Node"
                    : "Neural Branch"}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
