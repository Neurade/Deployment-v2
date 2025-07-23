package entity

type PermissionUserCourse struct {
	ID       int `gorm:"column:id;primaryKey"`
	UserID   int `gorm:"column:user_id"`
	CourseID int `gorm:"column:course_id"`
}
