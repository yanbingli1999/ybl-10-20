import { useState } from "react";
import { Users, Award, Briefcase, Clock, DollarSign, PlusCircle, Heart, Zap, Stethoscope, PawPrint, TrendingUp, Star, Sparkles } from "lucide-react";
import { useGameStore, SYNERGY_LEVEL_NAMES, SYNERGY_LEVEL_COLORS, getSynergyBonus, getFatiguePenalty, SYNERGY_TAGS, TAG_RARITY_COLORS, getSynergyTagBonus } from "@/store/gameStore";
import { BREEDS, DISEASE_NAMES } from "@/data/gameData";
import type { Bed, StaffPairRecord, StaffBreedExperience, StaffDiseaseExperience, DiseaseType } from "@/types/game";

const STATUS_INFO = {
  idle: { label: "空闲中", cls: "bg-emerald-100 text-emerald-700 border-emerald-300", dot: "bg-emerald-500" },
  working: { label: "工作中", cls: "bg-clinic-jade/15 text-clinic-jade border-clinic-jade/40", dot: "bg-clinic-jade animate-pulse" },
  resting: { label: "休息中", cls: "bg-gray-100 text-gray-600 border-gray-300", dot: "bg-gray-400" },
};

type TabType = "roster" | "pairs";

export default function StaffPage() {
  const staff = useGameStore(s => s.staff);
  const beds = useGameStore(s => s.beds);
  const staffPairs = useGameStore(s => s.staffPairs);
  const staffBreedExp = useGameStore(s => s.staffBreedExp);
  const staffDiseaseExp = useGameStore(s => s.staffDiseaseExp);
  const totalWage = staff.reduce((s, x) => s + x.dailyWage, 0);
  const workingCount = staff.filter(s => s.status === "working").length;
  const money = useGameStore(s => s.money);
  const [activeTab, setActiveTab] = useState<TabType>("roster");

  const hire = () => {
    if (money < 200) {
      alert("招募资金不足（需 200 金）");
      return;
    }
    const names = ["子墨", "婉清", "书瑶", "景天", "长卿", "雪见", "紫萱", "云霆"];
    const titles = ["护理员", "药童", "见习护士"];
    const emojis = ["👩‍⚕️", "👨‍⚕️", "👩‍🔬", "🧑‍⚕️", "👩‍🎓"];
    const newStaff = {
      id: `staff_${Date.now()}`,
      name: names[Math.floor(Math.random() * names.length)],
      title: titles[Math.floor(Math.random() * titles.length)],
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      skillLevel: 1,
      status: "idle" as const,
      assignedBedId: null,
      dailyWage: 25,
    };
    useGameStore.setState(s => ({
      money: s.money - 200,
      staff: [...s.staff, newStaff],
    }));
    useGameStore.getState()._addTransaction("expense", "招募员工", 200, `招募新员工：${newStaff.name}`);
    useGameStore.getState().addNotification("success", `🎉 成功招募员工 ${newStaff.name}！`);
  };

  const getBedInfo = (bedId: string | null): Bed | null => bedId ? beds.find(b => b.id === bedId) ?? null : null;

  const getStaffName = (id: string) => staff.find(s => s.id === id)?.name || "?";
  const getStaffEmoji = (id: string) => staff.find(s => s.id === id)?.emoji || "❓";

  const getStaffPairs = (staffId: string): StaffPairRecord[] => {
    return Object.values(staffPairs).filter(p => p.staffAId === staffId || p.staffBId === staffId)
      .sort((a, b) => b.synergyPoints - a.synergyPoints);
  };

  const getTopBreeds = (staffId: string): StaffBreedExperience[] => {
    const exp = staffBreedExp[staffId] || {};
    return Object.values(exp).sort((a, b) => b.treatments - a.treatments).slice(0, 3);
  };

  const getTopDiseases = (staffId: string): StaffDiseaseExperience[] => {
    const exp = staffDiseaseExp[staffId] || ({} as Record<DiseaseType, StaffDiseaseExperience>);
    return Object.values(exp).sort((a, b) => b.treatments - a.treatments).slice(0, 3);
  };

  const allPairs = Object.values(staffPairs).sort((a, b) => b.synergyPoints - a.synergyPoints);

  return (
    <div className="container px-4 py-6 space-y-6 animate-fade">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Users, label: "员工总数", val: staff.length, color: "text-clinic-jade" },
          { icon: Briefcase, label: "在岗人数", val: `${workingCount}/${staff.length}`, color: "text-blue-600" },
          { icon: DollarSign, label: "日薪总额", val: `${totalWage}金/天`, color: "text-clinic-amber" },
          { icon: Award, label: "平均技能", val: (staff.reduce((s, x) => s + x.skillLevel, 0) / Math.max(1, staff.length)).toFixed(1), color: "text-clinic-crisis" },
        ].map((m, i) => (
          <div key={i} className="card p-4">
            <div className="flex items-center gap-2 mb-1">
              <m.icon className={`w-5 h-5 ${m.color}`} />
              <span className="text-xs text-gray-600">{m.label}</span>
            </div>
            <div className={`text-2xl font-display font-bold tabular-nums ${m.color}`}>{m.val}</div>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xl text-clinic-deep flex items-center gap-2">
              <Users className="w-6 h-6 text-clinic-light-jade" />
              员工管理
            </h2>
            <div className="flex bg-clinic-bg rounded-lg p-1">
              <button
                onClick={() => setActiveTab("roster")}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  activeTab === "roster"
                    ? "bg-white text-clinic-deep shadow-sm"
                    : "text-gray-500 hover:text-clinic-deep"
                }`}
              >
                员工名册
              </button>
              <button
                onClick={() => setActiveTab("pairs")}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                  activeTab === "pairs"
                    ? "bg-white text-clinic-deep shadow-sm"
                    : "text-gray-500 hover:text-clinic-deep"
                }`}
              >
                <Heart className="w-3 h-3" />
                搭档组合
                {allPairs.length > 0 && (
                  <span className="bg-clinic-amber/30 text-clinic-deep px-1.5 rounded-full text-[10px]">
                    {allPairs.length}
                  </span>
                )}
              </button>
            </div>
          </div>
          {activeTab === "roster" && (
            <button
              onClick={hire}
              className="btn-amber flex items-center gap-1.5 text-sm"
            >
              <PlusCircle className="w-4 h-4" />
              招募新员工（💰200）
            </button>
          )}
        </div>

        {activeTab === "roster" && (
          <>
            {staff.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-40" />
                <p className="text-sm">还没有员工，快去招募吧！</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {staff.map(s => {
                  const info = STATUS_INFO[s.status];
                  const bed = getBedInfo(s.assignedBedId);
                  const snapshot = bed?.beastSnapshot;
                  const breed = snapshot ? BREEDS.find(b => b.id === snapshot.breedId) : null;
                  const pairs = getStaffPairs(s.id);
                  const topBreeds = getTopBreeds(s.id);
                  const topDiseases = getTopDiseases(s.id);

                  return (
                    <div key={s.id} className="rounded-xl border-2 border-clinic-border/50 bg-gradient-to-br from-white to-clinic-bg p-4 hover:-translate-y-0.5 hover:shadow-md transition-all">
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <div className="text-4xl w-14 h-14 rounded-2xl bg-white/80 border border-clinic-border/40 shadow-inner flex items-center justify-center">
                            {s.emoji}
                          </div>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white ${info.dot}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-clinic-deep text-lg">{s.name}</span>
                          </div>
                          <div className="text-xs text-gray-500 mb-1">{s.title}</div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`tag border ${info.cls}`}>
                              <Clock className="w-3 h-3" /> {info.label}
                            </span>
                            <span className="tag bg-clinic-amber/20 text-clinic-deep border-clinic-amber/40">
                              <Award className="w-3 h-3" /> Lv.{s.skillLevel}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2 rounded-lg bg-white/60 border border-clinic-border/30">
                          <div className="text-gray-500">成功率加成</div>
                          <div className="text-clinic-jade font-semibold text-sm">+{s.skillLevel * 5}%</div>
                        </div>
                        <div className="p-2 rounded-lg bg-white/60 border border-clinic-border/30">
                          <div className="text-gray-500">日薪</div>
                          <div className="text-clinic-amber font-semibold text-sm">💰 {s.dailyWage}</div>
                        </div>
                      </div>

                      {(topBreeds.length > 0 || topDiseases.length > 0) && (
                        <div className="mt-3 space-y-2">
                          {topBreeds.length > 0 && (
                            <div className="p-2 rounded-lg bg-white/60 border border-clinic-border/30">
                              <div className="text-[10px] text-gray-500 flex items-center gap-1 mb-1">
                                <PawPrint className="w-3 h-3" /> 擅长灵兽
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {topBreeds.map(exp => {
                                  const b = BREEDS.find(x => x.id === exp.breedId);
                                  const rate = exp.treatments > 0 ? Math.round(exp.successes / exp.treatments * 100) : 0;
                                  return (
                                    <span key={exp.breedId} className="tag bg-clinic-light-jade/15 text-clinic-deep border-clinic-light-jade/30 text-[10px]">
                                      {b?.emoji} {b?.name} <span className="text-gray-500">({rate}%)</span>
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          {topDiseases.length > 0 && (
                            <div className="p-2 rounded-lg bg-white/60 border border-clinic-border/30">
                              <div className="text-[10px] text-gray-500 flex items-center gap-1 mb-1">
                                <Stethoscope className="w-3 h-3" /> 擅长病种
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {topDiseases.map(exp => {
                                  const rate = exp.treatments > 0 ? Math.round(exp.successes / exp.treatments * 100) : 0;
                                  return (
                                    <span key={exp.disease} className="tag bg-clinic-jade/10 text-clinic-deep border-clinic-jade/30 text-[10px]">
                                      {DISEASE_NAMES[exp.disease]} <span className="text-gray-500">({rate}%)</span>
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {pairs.length > 0 && (
                        <div className="mt-3 p-2 rounded-lg bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200/50">
                          <div className="text-[10px] text-gray-500 flex items-center gap-1 mb-1">
                            <Heart className="w-3 h-3 text-pink-500" /> 最佳搭档
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {pairs.slice(0, 2).map(p => {
                              const partnerId = p.staffAId === s.id ? p.staffBId : p.staffAId;
                              const bonus = getSynergyBonus(p.synergyPoints);
                              const tagBonus = getSynergyTagBonus(p.synergyTags);
                              const totalBonus = bonus + tagBonus;
                              return (
                                <span
                                  key={p.pairId}
                                  className={`tag border text-[10px] ${SYNERGY_LEVEL_COLORS[p.synergyLevel]}`}
                                >
                                  {getStaffEmoji(partnerId)} {getStaffName(partnerId)}
                                  <span className="ml-1 opacity-75">
                                    {SYNERGY_LEVEL_NAMES[p.synergyLevel]} +{totalBonus}%
                                  </span>
                                  {p.synergyTags.length > 0 && (
                                    <span className="ml-1 text-amber-500">
                                      <Sparkles className="w-3 h-3 inline" />
                                    </span>
                                  )}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {s.status === "working" && snapshot && (
                        <div className="mt-3 p-2 rounded-lg bg-clinic-jade/10 border border-clinic-jade/30 text-xs">
                          <div className="font-semibold text-clinic-deep mb-0.5">正在护理：</div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xl">{breed?.emoji}</span>
                            <span>
                              {snapshot.name}（{breed?.name}）
                            </span>
                          </div>
                        </div>
                      )}

                      {s.status === "idle" && (
                        <div className="mt-3 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 text-center">
                          ✓ 随时可以分配到床位
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === "pairs" && (
          <>
            {allPairs.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Heart className="w-12 h-12 mx-auto mb-2 opacity-40" />
                <p className="text-sm">暂无搭档记录</p>
                <p className="text-[11px] mt-1 opacity-70">安排两名护理员共同治疗后，将建立默契关系</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allPairs.map(pair => {
                  const bonus = getSynergyBonus(pair.synergyPoints);
                  const penalty = getFatiguePenalty(pair.fatigue);
                  const tagBonus = getSynergyTagBonus(pair.synergyTags);
                  const totalMod = bonus + tagBonus + penalty;
                  const successRate = pair.totalTreatments > 0
                    ? Math.round(pair.successfulTreatments / pair.totalTreatments * 100)
                    : 0;
                  const breedsInfo = pair.adaptedBreeds.slice(0, 4).map(bid => {
                    const b = BREEDS.find(x => x.id === bid);
                    const count = pair.breedExperience[bid] || 0;
                    return b ? { emoji: b.emoji, name: b.name, count } : null;
                  }).filter(Boolean);
                  const diseasesInfo = pair.adaptedDiseases.slice(0, 4).map(d => ({
                    disease: d,
                    count: pair.diseaseExperience[d] || 0,
                  }));
                  const tags = pair.synergyTags.map(id => ({ id, ...SYNERGY_TAGS[id] })).filter(t => t.name);

                  return (
                    <div
                      key={pair.pairId}
                      className={`rounded-xl border-2 p-4 bg-gradient-to-br ${SYNERGY_LEVEL_COLORS[pair.synergyLevel]}`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="text-3xl w-12 h-12 rounded-xl bg-white/80 border border-white shadow-inner flex items-center justify-center">
                            {getStaffEmoji(pair.staffAId)}
                          </div>
                          <Heart className={`w-5 h-5 ${pair.fatigue >= 6 ? "text-clinic-crisis animate-pulse" : "text-pink-500"}`} />
                          <div className="text-3xl w-12 h-12 rounded-xl bg-white/80 border border-white shadow-inner flex items-center justify-center">
                            {getStaffEmoji(pair.staffBId)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-clinic-deep text-base flex items-center gap-2">
                            {getStaffName(pair.staffAId)} × {getStaffName(pair.staffBId)}
                            {tags.length > 0 && (
                              <span className="text-xs bg-gradient-to-r from-amber-400 to-orange-400 text-white px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                <Star className="w-3 h-3" />
                                {tags.length}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className={`tag border text-[10px] ${SYNERGY_LEVEL_COLORS[pair.synergyLevel]} bg-white/80`}>
                              <TrendingUp className="w-3 h-3" />
                              {SYNERGY_LEVEL_NAMES[pair.synergyLevel]} · {pair.synergyPoints}分
                            </span>
                            <span className="tag bg-white/70 text-clinic-deep border border-white text-[10px]">
                              共诊 {pair.totalTreatments} 次 · 成功率 {successRate}%
                            </span>
                            {tagBonus > 0 && (
                              <span className="tag bg-amber-100 text-amber-700 border border-amber-300 text-[10px]">
                                <Sparkles className="w-3 h-3" /> 标签加成 +{tagBonus}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {tags.length > 0 && (
                        <div className="mb-3">
                          <div className="text-[10px] text-gray-500 flex items-center gap-1 mb-1">
                            <Star className="w-3 h-3 text-amber-500" /> 默契标签
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {tags.map(tag => (
                              <span
                                key={tag.id}
                                className={`tag border text-[10px] ${TAG_RARITY_COLORS[tag.rarity]} flex items-center gap-0.5`}
                                title={tag.description}
                              >
                                {tag.icon} {tag.name} +{tag.bonus}%
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-4 gap-2 text-[11px] mb-3">
                        <div className="p-2 rounded-lg bg-white/70 border border-white/80">
                          <div className="text-gray-500 flex items-center gap-1">
                            <Heart className="w-3 h-3 text-pink-500" /> 默契
                          </div>
                          <div className="text-emerald-600 font-semibold text-sm">+{bonus}%</div>
                        </div>
                        <div className="p-2 rounded-lg bg-white/70 border border-white/80">
                          <div className="text-gray-500 flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-500" /> 标签
                          </div>
                          <div className={`font-semibold text-sm ${tagBonus > 0 ? "text-amber-600" : "text-gray-500"}`}>
                            {tagBonus > 0 ? `+${tagBonus}%` : "无"}
                          </div>
                        </div>
                        <div className="p-2 rounded-lg bg-white/70 border border-white/80">
                          <div className="text-gray-500 flex items-center gap-1">
                            <Zap className={`w-3 h-3 ${pair.fatigue >= 6 ? "text-clinic-crisis" : "text-gray-400"}`} />
                            疲劳
                          </div>
                          <div className={`font-semibold text-sm ${penalty < 0 ? "text-clinic-crisis" : "text-gray-500"}`}>
                            {penalty === 0 ? "无" : `${penalty}%`}
                            {pair.fatigue > 0 && <span className="ml-1 text-[10px]">({pair.fatigue}/10)</span>}
                          </div>
                        </div>
                        <div className="p-2 rounded-lg bg-white/70 border border-white/80">
                          <div className="text-gray-500 flex items-center gap-1">
                            <Award className="w-3 h-3 text-clinic-amber" /> 净加成
                          </div>
                          <div className={`font-semibold text-sm ${totalMod > 0 ? "text-emerald-600" : totalMod < 0 ? "text-clinic-crisis" : "text-gray-500"}`}>
                            {totalMod > 0 ? "+" : ""}{totalMod}%
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                        {breedsInfo.length > 0 && (
                          <div className="p-2 rounded-lg bg-white/60 border border-white/70">
                            <div className="text-gray-500 flex items-center gap-1 mb-1">
                              <PawPrint className="w-3 h-3" /> 适配灵兽（累计）
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {breedsInfo.map((b, i) => (
                                <span key={i} className="tag bg-clinic-light-jade/20 text-clinic-deep border-clinic-light-jade/40 text-[10px]">
                                  {b!.emoji} {b!.name} <span className="text-gray-500">×{b!.count}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {diseasesInfo.length > 0 && (
                          <div className="p-2 rounded-lg bg-white/60 border border-white/70">
                            <div className="text-gray-500 flex items-center gap-1 mb-1">
                              <Stethoscope className="w-3 h-3" /> 适配病种（累计）
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {diseasesInfo.map(d => (
                                <span key={d.disease} className="tag bg-clinic-jade/15 text-clinic-deep border-clinic-jade/40 text-[10px]">
                                  {DISEASE_NAMES[d.disease]} <span className="text-gray-500">×{d.count}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {pair.fatigue >= 6 && (
                        <div className="mt-2 p-2 rounded-lg bg-clinic-crisis/10 border border-clinic-crisis/30 text-[11px] text-clinic-crisis flex items-center gap-1.5">
                          <Zap className="w-4 h-4" />
                          ⚠️ 连续搭档疲劳值过高，建议更换搭档休息以恢复默契
                        </div>
                      )}
                      {pair.consecutiveDays >= 3 && pair.fatigue < 6 && (
                        <div className="mt-2 p-2 rounded-lg bg-clinic-amber/10 border border-clinic-amber/30 text-[11px] text-clinic-deep flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          已连续搭档 {pair.consecutiveDays} 天，注意适当休息
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
