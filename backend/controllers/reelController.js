const asyncHandler = require("express-async-handler");
const prisma = require("../lib/prisma"); // Make sure this path points to your prisma instance

// Public: Get active reels for Customer App
const getActiveReels = asyncHandler(async (req, res) => {
  const reels = await prisma.reel.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  res.status(200).json({ success: true, reels });
});

// Admin: Get all reels
const getAllReels = asyncHandler(async (req, res) => {
  const reels = await prisma.reel.findMany({
    orderBy: { sortOrder: "asc" },
  });
  res.status(200).json({ success: true, reels });
});

// Admin: Create reel
const createReel = asyncHandler(async (req, res) => {
  const { title, instagramUrl, videoUrl, sortOrder } = req.body;
  const reel = await prisma.reel.create({
    data: { 
      title, 
      instagramUrl, 
      videoUrl, 
      sortOrder: Number(sortOrder) || 0 
    },
  });
  res.status(201).json({ success: true, reel });
});

// Admin: Update reel
const updateReel = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, instagramUrl, videoUrl, isActive, sortOrder } = req.body;

  const dataToUpdate = {};
  if (title !== undefined) dataToUpdate.title = title;
  if (instagramUrl !== undefined) dataToUpdate.instagramUrl = instagramUrl;
  if (videoUrl !== undefined) dataToUpdate.videoUrl = videoUrl;
  if (isActive !== undefined) dataToUpdate.isActive = Boolean(isActive);
  if (sortOrder !== undefined) dataToUpdate.sortOrder = Number(sortOrder);

  const reel = await prisma.reel.update({
    where: { id },
    data: dataToUpdate,
  });

  res.status(200).json({ success: true, reel });
});

// Admin: Delete reel
const deleteReel = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.reel.delete({ where: { id } });
  res.status(200).json({ success: true, message: "Reel deleted" });
});

module.exports = {
  getActiveReels,
  getAllReels,
  createReel,
  updateReel,
  deleteReel,
};