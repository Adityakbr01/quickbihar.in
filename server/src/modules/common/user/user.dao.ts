import { User } from "./user.model";

export class UserDAO {
  static async createUser(userData: any) {
    return await User.create(userData);
  }

  static async findByUsernameOrEmail(username?: string, emailOrPhone?: string) {
    if (!username && !emailOrPhone) return null;
    const conditions: any[] = [];
    if (username) conditions.push({ username: username.toLowerCase() });
    if (emailOrPhone) {
      const val = emailOrPhone.trim();
      const rawPhone = val.replace(/\D/g, "");
      const cleanPhone = rawPhone.slice(-10);

      conditions.push({ email: val.toLowerCase() });
      conditions.push({ username: val.toLowerCase() });
      if (cleanPhone.length === 10) {
        conditions.push({ phone: cleanPhone });
        conditions.push({ phone: `+91${cleanPhone}` });
        conditions.push({ phone: `+91 ${cleanPhone}` });
      } else {
        conditions.push({ phone: val });
      }
    }
    return await User.findOne({ $or: conditions }).populate("roleId");
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
