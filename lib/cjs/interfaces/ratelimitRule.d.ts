export default interface RateLimitRule {
    /** The Path of the Rule */ path: string;
    /** How often a User can request */ times: number;
    /** How Long a Request stays counted */ timeout: number;
}
