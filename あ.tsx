"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { NetworkDiagram } from "@/components/NetworkDiagram"
import { Layout } from "@/components/Layout"
// db関数のインポートを追加（省略されていた場合）
import { saveProgress, getProgress } from "../../utils/db"

// ...既存のコード（devices, connections等）...

export default function IPAddressChallengePage() {
  // ...既存のステート...
  
  // ページロード時に保存されている進捗データを取得
  useEffect(() => {
    const fetchSavedProgress = async () => {
      try {
        // IndexedDBから進捗データを取得
        const progressData = await getProgress();
        
        // チャレンジは50%〜100%の部分を担当
        const totalProgress = progressData.ipAddress || 0;
        
        // チャレンジ部分の進捗を計算（50%より大きい部分）
        const challengeProgress = Math.max(totalProgress - 50, 0);
        
        // ローカルの進捗状態を更新
        setProgress(challengeProgress);
        
        // 正解状態を更新（進捗に基づいて）
        if (challengeProgress > 0) {
          const questionValue = 50 / 3; // 各問題は約16.67%の価値
          setCorrectAnswers({
            pc2IP: challengeProgress >= questionValue,
            subnetMask: challengeProgress >= questionValue * 2,
            defaultGateway: challengeProgress >= questionValue * 3,
          });
        }
        
        console.log(`IPチャレンジページ: 進捗データ読み込み完了 (${challengeProgress}%)`);
      } catch (error) {
        console.error('進捗データの取得に失敗しました:', error);
      }
    };
    
    fetchSavedProgress();
  }, []);

  // 正解状態が変わったときにIndexedDBに保存する
  useEffect(() => {
    const saveCurrentProgress = async () => {
      // 初期レンダリング時は実行しない
      if (Object.values(correctAnswers).every(value => value === false)) return;
      
      try {
        // チャレンジページの進捗を計算（50%を上限とする）
        const correctCount = Object.values(correctAnswers).filter(Boolean).length;
        const totalCount = Object.keys(correctAnswers).length;
        const challengeProgress = Math.round((correctCount / totalCount) * 50);
        
        // ローカルの進捗状態を更新
        setProgress(challengeProgress);
        
        // 現在の進捗データを取得
        const progressData = await getProgress();
        
        // 学習部分の進捗（0〜50%）を保持
        const learnProgress = Math.min(progressData.ipAddress || 0, 50);
        
        // 学習ページとチャレンジページの進捗を合計
        const newTotalProgress = Math.min(learnProgress + challengeProgress, 100);
        
        // IndexedDBに保存
        await saveProgress('ipAddress', newTotalProgress);
        
        console.log(`IPチャレンジページ: 進捗更新 (学習=${learnProgress}%, チャレンジ=${challengeProgress}%, 合計=${newTotalProgress}%)`);
      } catch (error) {
        console.error('進捗の保存に失敗しました:', error);
      }
    };
    
    saveCurrentProgress();
  }, [correctAnswers]);

  // ...既存のコード（checkPC2IP, checkSubnetMask等）...

  return (
    // ...既存のJSXコード...
  )
}