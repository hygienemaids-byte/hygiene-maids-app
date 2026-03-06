"use client";
import { Gift, Copy, CheckCircle2, Users, DollarSign, Share2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { toast } from "sonner";

export default function CustomerReferrals() {
  const [copied, setCopied] = useState(false);
  const referralCode = "HM-FRIEND25";
  const referralLink = `https://hygienemaids.com/book?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Refer & Earn</h1>
        <p className="text-slate-500 mt-1">Share the love and earn rewards for every friend who books.</p>
      </div>

      {/* Hero Card */}
      <Card className="border-teal-200 bg-gradient-to-br from-teal-50 via-white to-emerald-50 overflow-hidden">
        <CardContent className="py-8 text-center relative">
          <div className="absolute top-4 right-4 opacity-10">
            <Gift className="w-32 h-32 text-teal-600" />
          </div>
          <Gift className="w-12 h-12 text-teal-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900">Give $25, Get $25</h2>
          <p className="text-slate-600 mt-2 max-w-md mx-auto">
            Your friend gets $25 off their first cleaning, and you earn a $25 credit when they book.
            It&apos;s a win-win!
          </p>

          {/* Referral Link */}
          <div className="mt-6 max-w-md mx-auto">
            <div className="flex gap-2">
              <Input value={referralLink} readOnly className="bg-white text-center font-mono text-sm" />
              <Button onClick={handleCopy} className="bg-teal-600 hover:bg-teal-700 shrink-0">
                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-slate-400 mt-2">Your referral code: <span className="font-semibold">{referralCode}</span></p>
          </div>

          {/* Share buttons */}
          <div className="flex items-center justify-center gap-3 mt-5">
            <Button variant="outline" size="sm" className="border-slate-200">
              <Share2 className="w-4 h-4 mr-2" />
              Share via Email
            </Button>
            <Button variant="outline" size="sm" className="border-slate-200">
              <Share2 className="w-4 h-4 mr-2" />
              Share via Text
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200 bg-white">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Friends Referred</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">0</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Friends Who Booked</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">0</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Credits Earned</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">$0.00</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* How it works */}
      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-base">How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 font-bold flex items-center justify-center mx-auto mb-3">
                1
              </div>
              <h3 className="font-medium text-slate-900">Share Your Link</h3>
              <p className="text-sm text-slate-500 mt-1">Send your unique referral link to friends and family.</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 font-bold flex items-center justify-center mx-auto mb-3">
                2
              </div>
              <h3 className="font-medium text-slate-900">They Book & Save</h3>
              <p className="text-sm text-slate-500 mt-1">Your friend gets $25 off their first cleaning service.</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 font-bold flex items-center justify-center mx-auto mb-3">
                3
              </div>
              <h3 className="font-medium text-slate-900">You Earn Credit</h3>
              <p className="text-sm text-slate-500 mt-1">Once they complete their first cleaning, you get $25 credit.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral History */}
      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-base">Referral History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No referrals yet. Share your link to get started!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
