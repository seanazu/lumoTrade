"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, ChevronRight, BarChart3, Tag, Database } from "lucide-react";
import { Card } from "@/components/design-system/atoms/Card";
import { fadeInUp, staggerChildren, expandHeight } from "@/lib/animations/variants";

interface Feature {
  name: string;
  description: string;
  dataType: string;
  source: string;
  importance?: number;
}

interface FeatureCategory {
  name: string;
  count: number;
  color: string;
  features: Feature[];
}

interface FeaturesData {
  categories: FeatureCategory[];
  top_features?: Feature[];
}

export function FeatureExplorer() {
  const [data, setData] = useState<FeaturesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedSource, setSelectedSource] = useState<string>("all");

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/model/features");
      const featuresData = await response.json();
      setData(featuresData);
    } catch (error) {
      console.error("Failed to fetch features:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryName)) {
        next.delete(categoryName);
      } else {
        next.add(categoryName);
      }
      return next;
    });
  };

  const getColorClass = (color: string) => {
    const classes: Record<string, string> = {
      blue: "bg-blue-500/10 border-blue-500/30 text-blue-400",
      green: "bg-green-500/10 border-green-500/30 text-green-400",
      purple: "bg-purple-500/10 border-purple-500/30 text-purple-400",
      orange: "bg-orange-500/10 border-orange-500/30 text-orange-400",
      pink: "bg-pink-500/10 border-pink-500/30 text-pink-400",
      cyan: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400",
      amber: "bg-amber-500/10 border-amber-500/30 text-amber-400",
      gray: "bg-gray-500/10 border-gray-500/30 text-gray-400",
    };
    return classes[color] || classes.blue;
  };

  const getSourceBadgeColor = (source: string) => {
    const colors: Record<string, string> = {
      FMP: "bg-blue-500/20 text-blue-300",
      FRED: "bg-purple-500/20 text-purple-300",
      Yahoo: "bg-green-500/20 text-green-300",
      Computed: "bg-gray-500/20 text-gray-300",
    };
    return colors[source] || colors.Computed;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading features...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">Failed to load features</p>
      </Card>
    );
  }

  const filteredCategories = data.categories.map((category) => ({
    ...category,
    features: category.features.filter((feature) => {
      const matchesSearch =
        searchTerm === "" ||
        feature.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feature.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSource =
        selectedSource === "all" || feature.source === selectedSource;
      return matchesSearch && matchesSource;
    }),
  })).filter((category) => category.features.length > 0);

  const totalFeatures = data.categories.reduce((sum, cat) => sum + cat.count, 0);
  const sources = ["all", ...new Set(data.categories.flatMap((cat) => cat.features.map((f) => f.source)))];

  return (
    <motion.div
      className="space-y-6"
      variants={staggerChildren}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={fadeInUp}>
        <h3 className="text-2xl font-bold text-foreground mb-2">Feature Explorer</h3>
        <p className="text-muted-foreground">
          Explore all {totalFeatures} features used in model training
        </p>
      </motion.div>

      {/* Search and Filters */}
      <motion.div variants={fadeInUp}>
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search features..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Source Filter */}
            <div className="flex gap-2">
              {sources.map((source) => (
                <button
                  key={source}
                  onClick={() => setSelectedSource(source)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedSource === source
                      ? "bg-blue-500 text-white"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {source === "all" ? "All" : source}
                </button>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Feature Categories */}
      <motion.div className="space-y-3" variants={staggerChildren}>
        {filteredCategories.map((category) => {
          const isExpanded = expandedCategories.has(category.name);
          return (
            <motion.div key={category.name} variants={fadeInUp}>
              <Card className={`overflow-hidden border-2 ${getColorClass(category.color)}`}>
                <button
                  onClick={() => toggleCategory(category.name)}
                  className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-foreground" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-foreground" />
                    )}
                    <div className="text-left">
                      <h4 className="font-bold text-foreground">{category.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {category.features.length} features
                      </p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full ${getColorClass(category.color)}`}>
                    <span className="text-sm font-bold">{category.features.length}</span>
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-border"
                    >
                      <div className="p-4 space-y-2">
                        {category.features.map((feature, index) => (
                          <motion.div
                            key={feature.name}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.02 }}
                            className="p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <code className="text-sm font-mono font-semibold text-foreground">
                                    {feature.name}
                                  </code>
                                  <span className={`px-2 py-0.5 rounded text-xs ${getSourceBadgeColor(feature.source)}`}>
                                    {feature.source}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {feature.description}
                                </p>
                              </div>
                              {feature.importance && (
                                <div className="flex items-center gap-2">
                                  <BarChart3 className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm text-foreground font-medium">
                                    {(feature.importance * 100).toFixed(1)}%
                                  </span>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {filteredCategories.length === 0 && (
        <motion.div variants={fadeInUp}>
          <Card className="p-12">
            <div className="text-center text-muted-foreground">
              <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No features match your search criteria</p>
            </div>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}

