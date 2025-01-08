import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { Button } from "@/components/ui/button"

import { Target, TrendingUp, CheckCircle2, ListChecks } from "lucide-react"
import { createNewTest } from '@/actions/test'
import { redirect } from 'next/navigation'

import { DataTable } from "@/app/(Workspace)/workspace/practice/tests/components/data-table"
import { columns } from "@/app/(Workspace)/workspace/practice/tests/components/columns"
import { z } from "zod"

// Export the schema and type
export const TestSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  created_at: z.string().nullable().default(null),
  attempt_num: z.number().int().default(1).nullable(),
  completed_at: z.string().nullable().default(null),
  score: z.number().min(0).max(999.99).nullable(),
  total_questions: z.number().int().min(0).default(0),
  completed_questions: z.number().int().min(0).default(0),
  correct_answers: z.number().int().min(0).default(0),
  wrong_answers: z.number().int().min(0).default(0),
})

export type Test = z.infer<typeof TestSchema>

const RawTestSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  created_at: z.string().nullable().default(null),
  attempt_num: z.number().int().default(1).nullable(),
  completed_at: z.string().nullable().default(null),
  score: z.number().min(0).max(999.99).nullable(),
  test_prep_test_questions: z.array(z.object({
    question_id: z.string(),
    test_prep_questions_2: z.object({
      section_id: z.number(),
      test_prep_sections: z.object({
        name: z.string()
      })
    })
  })).optional(),
  test_prep_user_responses: z.array(z.object({
    is_correct: z.boolean()
  })).optional(),
})

// Modify the form action to handle the response
const handleCreateTest = async () => {
    'use server'
    const result = await createNewTest()
    if (result.error) {
        throw new Error(result.error)
    }
    if (result.redirect) {
        redirect(result.redirect)
    }
}

// Add interface for user response
interface TestUserResponse {
    is_correct: boolean
}

export default async function TestsPage() {
    const supabase = await createClient()

    // Fetch user's tests with questions and responses
    const { data: testsData, error: testsError } = await supabase
        .from('test_prep_tests')
        .select(`
            *,
            test_prep_test_questions(
                question_id,
                test_prep_questions_2:question_id(
                    section_id,
                    test_prep_sections(name)
                )
            ),
            test_prep_user_responses(is_correct)
        `)
        .order('created_at', { ascending: false })

    if (testsError) {
        console.error('Error fetching tests:', testsError)
        return <div>Error loading tests</div>
    }
    
    // Calculate statistics
    const totalTests = testsData?.length || 0
    const completedTests = testsData?.filter(t => t.completed_at)?.length || 0
    const totalQuestions = testsData?.reduce((acc, test) => 
        acc + (test.test_prep_test_questions?.length || 0), 0) || 0
    const correctAnswers = testsData?.reduce((acc, test) => 
        acc + (test.test_prep_user_responses?.filter((r: TestUserResponse) => r.is_correct)?.length || 0), 0) || 0

    // Parse and transform the data using Zod, explicitly typing the result as Test[]
    const tests: Test[] = (testsData || []).map((rawTest) => {
        const validatedRawTest = RawTestSchema.parse(rawTest)
        const totalQuestions = validatedRawTest.test_prep_test_questions?.length || 0
        const responses = validatedRawTest.test_prep_user_responses || []
        const completedQuestions = responses.length
        const correctAnswers = responses.filter(r => r.is_correct).length
        const wrongAnswers = completedQuestions - correctAnswers

        return TestSchema.parse({
            ...validatedRawTest,
            total_questions: totalQuestions,
            completed_questions: completedQuestions,
            correct_answers: correctAnswers,
            wrong_answers: wrongAnswers,
        })
    })

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Practice Tests</h1>
                <form action={handleCreateTest}>
                    <Button type="submit" size="sm" variant="secondary">
                        Create New Test
                    </Button>
                </form>
            </div>

            {/* Performance Overview */}
            <div className="grid gap-4 md:grid-cols-4">
                {[
                    {
                        title: "Total Tests",
                        value: totalTests,
                        icon: Target,
                    },
                    {
                        title: "Completed Tests",
                        value: completedTests,
                        icon: CheckCircle2,
                    },
                    {
                        title: "Total Questions",
                        value: totalQuestions,
                        icon: ListChecks,
                    },
                    {
                        title: "Correct Answers",
                        value: correctAnswers,
                        icon: TrendingUp,
                    },
                ].map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Test History Table*/}
            <DataTable columns={columns} data={tests} />
        </div>
    )
}