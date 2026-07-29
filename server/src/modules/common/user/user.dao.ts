import { User } from "./user.model";

export class UserDAO {
  static async createUser(userData: any) {
    return await User.create(userData);
  }

  static async findByUsernameOrEmail(username?: string, email?: string) {
    if (!username && !email) return null;
    return await User.findOne({
      $or: [{ username }, { email }],
    }).populate("roleId");
  }

  static async findById(id: string) {
    return await User.findById(id).select("-password").populate("roleId");
  }

  static async updateById(id: string, updateData: any) {
    return await User.findByIdAndUpdate(id, updateData, { returnDocument: "after" })
      .select("-password")
      .populate("roleId");
  }

  static async findByRefreshToken(refreshToken: string) {
    return await User.findOne({ refreshToken }).populate("roleId");
  }

  static async findOne(query: any) {
    return await User.findOne(query).populate("roleId");
  }

  static async findAll() {
    return await User.find({}).select("-password").populate("roleId");
  }

}
