"use client";

import * as React from "react";
import {
  TabNavigation,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/design-system/molecules/TabNavigation";
import { FundamentalsTab } from "./FundamentalsTab";
import { NewsFeedTab } from "./NewsFeedTab";
import { OptionsTab } from "./OptionsTab";
import { RiskTab } from "./RiskTab";
import { NewsItem } from "@/resources/mock-data/news";

interface DeepDiveTabsProps {
  ticker: string;
  news: NewsItem[];
}

const DeepDiveTabs: React.FC<DeepDiveTabsProps> = ({ ticker, news }) => {
  return (
    <TabNavigation defaultValue="fundamentals" className="w-full">
      <TabsList className="w-full grid grid-cols-4">
        <TabsTrigger value="fundamentals">Fundamentals</TabsTrigger>
        <TabsTrigger value="news">News Feed</TabsTrigger>
        <TabsTrigger value="options">Options & Short</TabsTrigger>
        <TabsTrigger value="risk">Risk</TabsTrigger>
      </TabsList>

      <TabsContent value="fundamentals">
        <FundamentalsTab ticker={ticker} />
      </TabsContent>

      <TabsContent value="news">
        <NewsFeedTab news={news} />
      </TabsContent>

      <TabsContent value="options">
        <OptionsTab ticker={ticker} />
      </TabsContent>

      <TabsContent value="risk">
        <RiskTab ticker={ticker} />
      </TabsContent>
    </TabNavigation>
  );
};

export { DeepDiveTabs };

